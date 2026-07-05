-- 0053 — Compte de démonstration pour les examinateurs Google Play.
-- Play refuse d'examiner l'app sans identifiants d'accès (« Informations de
-- connexion manquantes »). On ajoute UNE exception au mode réel de otp_login :
-- le numéro factice +216 00 000 000 (inattribuable : aucun numéro tunisien ne
-- commence par 0) accepte le code fixe 123456. Aucun autre numéro n'est
-- concerné ; le mode démo global (vault otp_demo_mode) reste éteint.

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
    -- MODE DÉMO : on accepte n'importe quel code 4-6 chiffres. On consomme le
    -- dernier code du numéro (ou on en crée un consommé) pour satisfaire le
    -- trigger anti-squat.
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
    -- On journalise un code consommé pour satisfaire le trigger anti-squat.
    insert into public.phone_otp (phone, code, expires_at, consumed, consumed_at)
    values (p_phone, '123456', now() + interval '1 minute', true, now());
  else
    -- MODE RÉEL : code exact, non consommé, non expiré, tentatives limitées.
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

  -- Si le compte existe déjà avec un ANCIEN mot de passe (schéma déterministe
  -- V0), on réaligne son hash sur le schéma HMAC pour que le signIn marche.
  update auth.users
    set encrypted_password = extensions.crypt(v_pw, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
  where email = v_email;

  return jsonb_build_object('ok', true, 'email', v_email, 'password', v_pw);
end;
$function$;
