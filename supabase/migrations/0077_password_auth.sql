-- Machii — Connexion par MOT DE PASSE (en plus du code WhatsApp).
-- N'altère pas otp_login : password_login vérifie le mdp choisi puis ouvre la
-- session via le même mot de passe dérivé (_machii_derive_password). WhatsApp reste OK.

alter table public.profiles add column if not exists password_hash text;

-- Définir / changer son mot de passe (utilisateur connecté). Bcrypt, min 8.
create or replace function public.set_password(p_password text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'not_auth'); end if;
  if p_password is null or length(p_password) < 8 then
    return jsonb_build_object('ok', false, 'reason', 'too_short');
  end if;
  update public.profiles
    set password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
    where id = v_uid;
  return jsonb_build_object('ok', true);
end; $fn$;

-- L'utilisateur a-t-il un mot de passe défini ?
create or replace function public.has_password()
returns boolean
language sql security definer set search_path = public as $fn$
  select coalesce((select password_hash is not null from public.profiles where id = auth.uid()), false);
$fn$;

-- Connexion par mot de passe : vérifie le mdp, puis renvoie la session (même format que otp_login).
create or replace function public.password_login(p_phone text, p_password text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $fn$
declare
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email  text;
  v_uid    uuid;
  v_hash   text;
  v_pw     text;
begin
  if length(v_digits) < 6 then return jsonb_build_object('ok', false, 'reason', 'invalid_phone'); end if;
  v_email := v_digits || '@machii.local';
  select id into v_uid from auth.users where email = v_email limit 1;
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'no_account'); end if;
  select password_hash into v_hash from public.profiles where id = v_uid;
  if v_hash is null then return jsonb_build_object('ok', false, 'reason', 'no_password'); end if;
  if extensions.crypt(coalesce(p_password, ''), v_hash) <> v_hash then
    return jsonb_build_object('ok', false, 'reason', 'bad_password');
  end if;
  v_pw := public._machii_derive_password(v_digits);
  update auth.users
    set encrypted_password = extensions.crypt(v_pw, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
  where id = v_uid;
  return jsonb_build_object('ok', true, 'email', v_email, 'password', v_pw);
end; $fn$;

revoke all on function public.set_password(text) from public;
revoke all on function public.password_login(text, text) from public;
grant execute on function public.set_password(text) to authenticated;
grant execute on function public.has_password() to authenticated;
grant execute on function public.password_login(text, text) to anon, authenticated;
