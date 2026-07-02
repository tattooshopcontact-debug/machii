-- ============================================================================
-- Machii — KYC : verrou de publication + modération admin DANS l'app.
--
-- 1. profiles.is_admin : identifie les modérateurs (Faouez).
-- 2. Flag F10 `kyc_publish_gate` (OFF par défaut) : quand il est ON, un
--    conducteur NON vérifié ne peut plus publier de trajet. OFF pendant le
--    test fermé pour ne pas bloquer les testeurs, ON à la mise en production.
--    Le verrou est appliqué CÔTÉ SERVEUR (trigger) + côté client (UI).
-- 3. RPC admin_list_kyc / admin_review_kyc : l'admin voit les documents et
--    approuve/refuse depuis l'app. À l'approbation, le badge "Vérifié" du
--    profil est recalculé automatiquement selon le rôle :
--      conducteur (driver/both) = cin + permis + carte_grise + photo_vehicule
--      passager                 = cin seule
-- 4. Policy storage : l'admin peut lire les documents du bucket kyc
--    (nécessaire pour générer les signed URLs des aperçus).
--
-- Pour donner les droits admin à un compte (à faire une fois, SQL editor) :
--   update public.profiles set is_admin = true where phone = '+216XXXXXXXX';
--
-- Idempotent.
-- ============================================================================

-- 1. Colonne admin ------------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- 2. Flag F10 ------------------------------------------------------------------
insert into public.feature_flags (key, num, label, version, enabled)
values ('kyc_publish_gate', 10, 'Verrou publication : conducteur vérifié obligatoire', 'v1.2.0', false)
on conflict (key) do update
  set num = excluded.num, label = excluded.label, version = excluded.version;
-- (enabled volontairement non touché si la ligne existe)

-- Verrou serveur : impossible de publier un trajet si le flag est ON et que
-- le conducteur n'est pas vérifié (l'UI client affiche le même verrou).
create or replace function public.enforce_kyc_publish_gate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce((select enabled from feature_flags where key = 'kyc_publish_gate'), false)
     and not coalesce((select is_verified from profiles where id = new.driver_id), false) then
    raise exception 'kyc_required';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_kyc_publish_gate on public.trips;
create trigger trg_kyc_publish_gate
  before insert on public.trips
  for each row execute function public.enforce_kyc_publish_gate();

-- 3. RPC modération -------------------------------------------------------------
-- Liste tous les documents KYC (docs en attente d'abord). Vide si pas admin.
create or replace function public.admin_list_kyc()
returns table (
  doc_id uuid,
  profile_id uuid,
  full_name text,
  phone text,
  role text,
  is_verified boolean,
  doc_type text,
  file_path text,
  status text,
  created_at timestamptz,
  reviewed_at timestamptz
) language sql security definer set search_path = public as $$
  select d.id, p.id, p.full_name, p.phone, p.role::text, p.is_verified,
         d.doc_type::text, d.file_path, d.status::text, d.created_at, d.reviewed_at
  from kyc_documents d
  join profiles p on p.id = d.profile_id
  where coalesce((select pr.is_admin from profiles pr where pr.id = auth.uid()), false)
  order by (d.status = 'pending') desc, d.created_at desc;
$$;
revoke all on function public.admin_list_kyc() from public, anon;
grant execute on function public.admin_list_kyc() to authenticated;

-- Approuve/refuse un document puis recalcule le badge Vérifié du profil.
create or replace function public.admin_review_kyc(p_doc_id uuid, p_approve boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_profile uuid;
  v_role text;
  v_required text[];
  v_missing int;
begin
  if not coalesce((select is_admin from profiles where id = auth.uid()), false) then
    return json_build_object('ok', false, 'reason', 'not_admin');
  end if;

  update kyc_documents
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewed_at = now()
   where id = p_doc_id
   returning kyc_documents.profile_id into v_profile;

  if v_profile is null then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  select p.role::text into v_role from profiles p where p.id = v_profile;
  if v_role in ('driver', 'both') then
    v_required := array['cin', 'permis', 'carte_grise', 'photo_vehicule'];
  else
    v_required := array['cin'];
  end if;

  select count(*) into v_missing
  from unnest(v_required) req
  where not exists (
    select 1 from kyc_documents d
    where d.profile_id = v_profile
      and d.doc_type::text = req
      and d.status = 'approved'
  );

  update profiles set is_verified = (v_missing = 0) where id = v_profile;

  return json_build_object('ok', true, 'verified', v_missing = 0);
end;
$$;
revoke all on function public.admin_review_kyc(uuid, boolean) from public, anon;
grant execute on function public.admin_review_kyc(uuid, boolean) to authenticated;

-- 4. Lecture storage pour l'admin ------------------------------------------------
drop policy if exists "kyc admin select" on storage.objects;
create policy "kyc admin select" on storage.objects for select
  using (
    bucket_id = 'kyc'
    and coalesce((select is_admin from public.profiles where id = auth.uid()), false)
  );
