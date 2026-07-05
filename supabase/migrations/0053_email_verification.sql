-- ============================================================================
-- Machii — Vérification E-MAIL des conducteurs (décision Faouez 2026-07-05)
--
-- Règle : le badge « vérifié » (profiles.is_verified) exige désormais
--   IDENTITÉ (Didit/KYC) + E-MAIL vérifié.
-- Design rétro-compatible : l'app affiche toujours is_verified — c'est le
-- serveur qui le retient tant que l'e-mail manque. Aucune modif d'app requise.
--   - identity_verified : l'identité est validée (posé par Didit/admin via
--     l'interception du trigger quand ils tentent is_verified=true).
--   - email_verified_at : e-mail confirmé par code.
--   - is_verified vrai SEULEMENT quand les deux y sont.
-- Grandfather : les vérifiés existants gardent leur badge (pas de rug-pull
-- sur les testeurs) ; la règle s'applique aux prochaines vérifications.
--
-- Envoi des codes : le daemon VPS `machii-mailer` lit email_otp (sent_at null)
-- et envoie via Gmail machii.app@gmail.com. Idempotent.
-- ============================================================================

-- 1. Colonnes ---------------------------------------------------------------------
alter table public.profiles add column if not exists contact_email text;
alter table public.profiles add column if not exists email_verified_at timestamptz;
alter table public.profiles add column if not exists identity_verified boolean not null default false;

-- Grandfather : ceux qui ont déjà le badge ont l'identité validée.
update public.profiles set identity_verified = true where is_verified and not identity_verified;

-- 2. Guard : ces colonnes sont inaltérables par un non-admin ------------------------
create or replace function public.guard_profile_privileged_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.is_admin is distinct from old.is_admin
     or new.is_verified is distinct from old.is_verified
     or new.is_suspended is distinct from old.is_suspended
     or new.identity_verified is distinct from old.identity_verified
     or new.contact_email is distinct from old.contact_email
     or new.email_verified_at is distinct from old.email_verified_at then
    if current_user not in ('postgres', 'supabase_admin', 'service_role')
       and not coalesce((select is_admin from profiles where id = auth.uid()), false) then
      raise exception 'forbidden: privileged column change';
    end if;
  end if;
  return new;
end;
$$;

-- 3. Règle du badge : is_verified = identité + e-mail --------------------------------
-- Intercepte toute tentative de passer is_verified à true (Didit, admin_review_kyc,
-- admin_set_verified) : enregistre l'identité, retient le badge si e-mail absent.
create or replace function public.enforce_badge_requires_email()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.is_verified and not old.is_verified then
    new.identity_verified := true;
    if new.email_verified_at is null then
      new.is_verified := false; -- retenu jusqu'à la vérification e-mail
    end if;
  elsif old.is_verified and not new.is_verified then
    new.identity_verified := false; -- retrait explicite du badge = retrait complet
  end if;
  return new;
end;
$$;
drop trigger if exists trg_badge_requires_email on public.profiles;
create trigger trg_badge_requires_email
  before update on public.profiles
  for each row execute function public.enforce_badge_requires_email();

-- 4. Codes e-mail -------------------------------------------------------------------
create table if not exists public.email_otp (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  email      text not null,
  code       text not null,
  expires_at timestamptz not null,
  attempts   int not null default 0,
  sent_at    timestamptz,
  send_error text,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
alter table public.email_otp enable row level security;
drop policy if exists "email_otp deny all" on public.email_otp;
create policy "email_otp deny all" on public.email_otp for select using (false);

-- 5. RPC : demander un code ----------------------------------------------------------
create or replace function public.request_email_verification(p_email text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_code text;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'not_auth'); end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$' then
    return jsonb_build_object('ok', false, 'reason', 'bad_email');
  end if;
  -- anti-spam : 3 envois max par heure et par compte
  if (select count(*) from email_otp where user_id = v_uid and created_at > now() - interval '1 hour') >= 3 then
    return jsonb_build_object('ok', false, 'reason', 'too_many');
  end if;
  v_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');
  insert into email_otp (user_id, email, code, expires_at)
  values (v_uid, v_email, v_code, now() + interval '10 minutes');
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.request_email_verification(text) from public, anon;
grant execute on function public.request_email_verification(text) to authenticated;

-- 6. RPC : confirmer le code ----------------------------------------------------------
create or replace function public.confirm_email_verification(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_row email_otp%rowtype;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'not_auth'); end if;
  select * into v_row from email_otp
   where user_id = v_uid and used_at is null and expires_at > now()
   order by created_at desc limit 1;
  if v_row.id is null then return jsonb_build_object('ok', false, 'reason', 'no_active_code'); end if;
  if v_row.attempts >= 5 then return jsonb_build_object('ok', false, 'reason', 'too_many_attempts'); end if;
  if v_row.code <> regexp_replace(coalesce(p_code, ''), '\D', '', 'g') then
    update email_otp set attempts = attempts + 1 where id = v_row.id;
    return jsonb_build_object('ok', false, 'reason', 'bad_code');
  end if;
  update email_otp set used_at = now() where id = v_row.id;
  update profiles set contact_email = v_row.email, email_verified_at = now() where id = v_uid;
  -- si l'identité était déjà validée → le badge complet s'allume
  update profiles set is_verified = true
   where id = v_uid and identity_verified and not is_verified;
  return jsonb_build_object('ok', true, 'email', v_row.email);
end;
$$;
revoke all on function public.confirm_email_verification(text) from public, anon;
grant execute on function public.confirm_email_verification(text) to authenticated;

-- 7. RPC : mon statut e-mail (pour l'écran Vérification) -------------------------------
create or replace function public.get_my_email_status()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'email', (select contact_email from profiles where id = auth.uid()),
    'verified_at', (select email_verified_at from profiles where id = auth.uid()),
    'identity_verified', (select identity_verified from profiles where id = auth.uid()),
    'pending', exists(select 1 from email_otp where user_id = auth.uid() and used_at is null and expires_at > now())
  );
$$;
revoke all on function public.get_my_email_status() from public, anon;
grant execute on function public.get_my_email_status() to authenticated;
