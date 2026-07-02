-- ============================================================================
-- Machii — KYC : verrou de publication + modération admin DANS l'app + DURCISSEMENT.
--
-- 1. profiles.is_admin : identifie les modérateurs (Faouez).
-- 2. Flag F10 `kyc_publish_gate` (OFF par défaut) : quand ON, un conducteur NON
--    vérifié ne peut plus publier (trigger serveur + UI).
-- 3. DURCISSEMENT KYC (audit sécurité 2026-07-02) : un utilisateur ne doit PAS
--    pouvoir valider ses propres documents. La policy historique "kyc owner"
--    (FOR ALL, 0001) laissait le propriétaire écrire `status='approved'` sur ses
--    lignes. On ajoute :
--      - colonne `reviewed_by` (qui a validé) ;
--      - trigger `kyc_guard_and_reset` : force status='pending' à l'upload, remet
--        en attente sur ré-upload, et GÈLE status/reviewed_at/reviewed_by pour
--        tout non-admin (les décisions passent par admin_review_kyc uniquement) ;
--      - le recompte de `is_verified` n'accepte QUE les docs `approved` avec
--        `reviewed_by` non null (donc validés par un admin, jamais auto-posés).
-- 4. DURCISSEMENT profiles : trigger `guard_profile_privileged_columns` qui
--    empêche tout non-admin de modifier is_admin / is_verified (ferme aussi le
--    trou historique : "profiles self update" sans WITH CHECK).
-- 5. RPC admin_list_kyc / admin_review_kyc + policy storage lecture admin.
--
-- Donner les droits admin (une fois, SQL editor) :
--   update public.profiles set is_admin = true where phone = '+216XXXXXXXX';
--
-- Idempotent.
-- ============================================================================

-- 1. Colonnes ------------------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.kyc_documents add column if not exists reviewed_by uuid references public.profiles(id);

-- 2. Flag F10 ------------------------------------------------------------------
insert into public.feature_flags (key, num, label, version, enabled)
values ('kyc_publish_gate', 10, 'Verrou publication : conducteur vérifié obligatoire', 'v1.2.0', false)
on conflict (key) do update
  set num = excluded.num, label = excluded.label, version = excluded.version;

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

-- 3. Durcissement kyc_documents ------------------------------------------------
-- Un non-admin ne peut jamais fixer/altérer status, reviewed_at, reviewed_by.
-- ⚠️ IMPÉRATIF : trigger en SECURITY INVOKER (défaut) — en DEFINER, current_user
-- vaudrait TOUJOURS le propriétaire (postgres) et le gel ne s'appliquerait
-- jamais. En INVOKER, current_user = rôle appelant réel : 'authenticated' via
-- PostgREST (gelé) ; 'postgres' quand admin_review_kyc (SECURITY DEFINER) écrit
-- (laissé passer). C'est ce qui rend le durcissement effectif.
create or replace function public.kyc_guard_and_reset()
returns trigger language plpgsql set search_path = public as $$
declare
  v_is_admin boolean := coalesce((select is_admin from profiles where id = auth.uid()), false);
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') or v_is_admin then
    return new; -- décision admin / contexte privilégié : rien à forcer
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.reviewed_at := null;
    new.reviewed_by := null;
  elsif tg_op = 'UPDATE' then
    if new.file_path is distinct from old.file_path then
      -- ré-upload d'un document → repasse en attente d'examen
      new.status := 'pending';
      new.reviewed_at := null;
      new.reviewed_by := null;
    else
      -- toute autre modif par le propriétaire ne peut PAS toucher la modération
      new.status := old.status;
      new.reviewed_at := old.reviewed_at;
      new.reviewed_by := old.reviewed_by;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_kyc_guard on public.kyc_documents;
create trigger trg_kyc_guard
  before insert or update on public.kyc_documents
  for each row execute function public.kyc_guard_and_reset();

-- 4. Durcissement profiles : is_admin / is_verified inaltérables par le user ----
-- Même impératif : SECURITY INVOKER pour que current_user reflète l'appelant.
create or replace function public.guard_profile_privileged_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.is_admin is distinct from old.is_admin
     or new.is_verified is distinct from old.is_verified then
    if current_user not in ('postgres', 'supabase_admin', 'service_role')
       and not coalesce((select is_admin from profiles where id = auth.uid()), false) then
      raise exception 'forbidden: privileged column change';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_privileged on public.profiles;
create trigger trg_guard_profile_privileged
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

-- 5. RPC modération -------------------------------------------------------------
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

-- Approuve/refuse un document (trace reviewed_by), puis recalcule le badge.
create or replace function public.admin_review_kyc(p_doc_id uuid, p_approve boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_admin uuid := auth.uid();
  v_profile uuid;
  v_role text;
  v_required text[];
  v_missing int;
begin
  if not coalesce((select is_admin from profiles where id = v_admin), false) then
    return json_build_object('ok', false, 'reason', 'not_admin');
  end if;

  update kyc_documents
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewed_at = now(),
         reviewed_by = v_admin
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

  -- N'accepte QUE les documents validés par un VRAI admin (défense en
  -- profondeur : reviewed_by doit pointer vers un profil is_admin).
  select count(*) into v_missing
  from unnest(v_required) req
  where not exists (
    select 1 from kyc_documents d
    join profiles a on a.id = d.reviewed_by and a.is_admin
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

-- 6. Lecture storage pour l'admin ------------------------------------------------
drop policy if exists "kyc admin select" on storage.objects;
create policy "kyc admin select" on storage.objects for select
  using (
    bucket_id = 'kyc'
    and coalesce((select is_admin from public.profiles where id = auth.uid()), false)
  );
