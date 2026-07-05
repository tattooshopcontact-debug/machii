-- 0057 — Compte de TEST interne (Faouez) pour explorer le site comme un vrai
-- utilisateur non-admin. Ajoute une 2e exception au mode réel de otp_login,
-- SANS retirer celle des examinateurs Google (+216 00 000 000 / 123456).
-- Numéro de test : +216 12 345 678, code fixe 000000 (numéro non attribuable).
-- Base : version live 0053_google_review_account.

CREATE OR REPLACE FUNCTION public.otp_login(p_phone text, p_code text, p_full_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'extensions'
AS $function$
declare
  v_digits text := regexp_replace(p_phone, '\D', '', 'g');
  v_demo   text;
  v_otp    public.phone_otp%rowtype;
  v_email  text;
  v_pw     text;
begin
  if v_digits is null or length(v_digits) < 6 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_phone');
  end if;

  select decrypted_secret into v_demo from vault.decrypted_secrets where name = 'otp_demo_mode' limit 1;

  if coalesce(v_demo, 'false') = 'true' then
    if p_code !~ '^\d{4,6}$' then
      return jsonb_build_object('ok', false, 'reason', 'bad_code');
    end if;
    update public.phone_otp
      set consumed = true, consumed_at = now()
      where id = (select id from public.phone_otp where phone = p_phone order by created_at desc limit 1);
    if not found then
      insert into public.phone_otp (phone, code, expires_at, consumed, consumed_at)
      values (p_phone, p_code, now() + interval '1 minute', true, now());
    end if;
  elsif p_phone = '+21600000000' and regexp_replace(coalesce(p_code, ''), '\D', '', 'g') = '123456' then
    -- COMPTE DÉMO GOOGLE PLAY (examinateurs) : numéro factice, code fixe.
    insert into public.phone_otp (phone, code, expires_at, consumed, consumed_at)
    values (p_phone, '123456', now() + interval '1 minute', true, now());
  elsif p_phone = '+21612345678' and regexp_replace(coalesce(p_code, ''), '\D', '', 'g') = '000000' then
    -- COMPTE DE TEST INTERNE (Faouez) : numéro factice, code fixe.
    insert into public.phone_otp (phone, code, expires_at, consumed, consumed_at)
    values (p_phone, '000000', now() + interval '1 minute', true, now());
  else
    select * into v_otp
    from public.phone_otp
    where phone = p_phone and consumed = false and expires_at > now()
    order by created_at desc
    limit 1;

    if v_otp.id is null then
      return jsonb_build_object('ok', false, 'reason', 'no_active_code');
    end if;

    if v_otp.attempts >= 5 then
      update public.phone_otp set consumed = true, consumed_at = now() where id = v_otp.id;
      return jsonb_build_object('ok', false, 'reason', 'too_many_attempts');
    end if;

    if v_otp.code <> regexp_replace(coalesce(p_code, ''), '\D', '', 'g') then
      update public.phone_otp set attempts = attempts + 1 where id = v_otp.id;
      return jsonb_build_object('ok', false, 'reason', 'bad_code');
    end if;

    update public.phone_otp set consumed = true, consumed_at = now() where id = v_otp.id;
  end if;

  v_email := v_digits || '@machii.local';
  v_pw    := public._machii_derive_password(v_digits);

  update auth.users
    set encrypted_password = extensions.crypt(v_pw, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
  where email = v_email;

  return jsonb_build_object('ok', true, 'email', v_email, 'password', v_pw);
end;
$function$;
