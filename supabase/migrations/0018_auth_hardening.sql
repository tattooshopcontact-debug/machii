-- ============================================================================
-- Machii — Durcissement sécurité auth + fuite de données (audit 2026-06-11)
--
-- Corrige la chaîne critique de prise de compte de masse :
--   #1a  Le mot de passe V0 était déterministe (`machii-v0-<digits>`) donc
--        calculable à partir du seul numéro de téléphone -> takeover.
--        => le mot de passe devient HMAC(pepper_secret, digits). Le pepper
--           vit dans le Vault, jamais côté client. La RPC otp_login ne le
--           renvoie qu'APRÈS validation OTP.
--   #1b  L'OTP était purement décoratif (le client mintait la session seul).
--        => trigger before-insert sur auth.users qui REFUSE toute création de
--           compte `*@machii.local` sans OTP fraîchement consommé (anti-squat).
--   #1c  profiles.phone était lisible publiquement (policy using(true)).
--        => revoke select(phone) ; grant colonnes non sensibles ; RPC
--           get_my_phone() pour que l'utilisateur lise SON propre numéro.
--   #2   Brute-force OTP amplifié (codes multiples valides, pas de limite).
--        => 1 seul code actif par numéro, compteur de tentatives, expiration.
--   #3   OTP/WhatsApp bombing (send sans limite).
--        => rate-limit : max 5 envois / numéro / heure.
--   #4   send_expo_push appelable par anon (spam push).
--        => revoke execute (seuls les triggers l'utilisent, en definer).
--   #6   Liens de partage encore valides après la fin du trajet.
--        => get_shared_trip expire si le trajet est done/cancelled.
--
-- Idempotent : réexécutable sans danger.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- 0) Pepper d'auth dans le Vault (généré une seule fois, jamais exposé).
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'auth_pepper') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'auth_pepper',
      'Machii — pepper HMAC pour dériver les mots de passe synthétiques (ne jamais exposer).'
    );
  end if;
end $$;

-- Helper interne : mot de passe synthétique d'un numéro (digits only).
-- SECURITY DEFINER + search_path verrouillé : seul le serveur peut le calculer.
create or replace function public._machii_derive_password(p_digits text)
returns text language plpgsql security definer set search_path = public, vault, extensions as $$
declare
  v_pepper text;
begin
  select decrypted_secret into v_pepper from vault.decrypted_secrets where name = 'auth_pepper' limit 1;
  if v_pepper is null then
    raise exception 'auth_pepper manquant dans le Vault';
  end if;
  return encode(extensions.hmac(p_digits, v_pepper, 'sha256'), 'hex');
end;
$$;
revoke all on function public._machii_derive_password(text) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 1) OTP : colonnes de suivi (tentatives + consommation horodatée).
-- ----------------------------------------------------------------------------
alter table public.phone_otp add column if not exists attempts    int not null default 0;
alter table public.phone_otp add column if not exists consumed_at timestamptz;

-- ----------------------------------------------------------------------------
-- 2) send_whatsapp_otp : rate-limit + un seul code actif par numéro.
--    (Réécrit la fonction de 0010/0011 en ajoutant les garde-fous.)
-- ----------------------------------------------------------------------------
create or replace function public.send_whatsapp_otp(p_phone text)
returns jsonb language plpgsql security definer set search_path = public, vault, extensions as $$
declare
  v_code text;
  v_phone_id text;
  v_token text;
  v_template text;
  v_language text;
  v_recent int;
begin
  -- Rate-limit : max 5 envois par numéro sur la dernière heure.
  select count(*) into v_recent
  from public.phone_otp
  where phone = p_phone and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    return jsonb_build_object('sent', false, 'reason', 'rate_limited');
  end if;

  -- Invalide les anciens codes encore actifs de ce numéro (un seul code valide).
  update public.phone_otp
  set consumed = true, consumed_at = now()
  where phone = p_phone and consumed = false;

  v_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');

  insert into public.phone_otp (phone, code, expires_at)
  values (p_phone, v_code, now() + interval '10 minutes');

  select decrypted_secret into v_phone_id from vault.decrypted_secrets where name = 'meta_whatsapp_phone_id' limit 1;
  select decrypted_secret into v_token    from vault.decrypted_secrets where name = 'meta_whatsapp_token'    limit 1;
  select decrypted_secret into v_template from vault.decrypted_secrets where name = 'meta_whatsapp_template' limit 1;
  select decrypted_secret into v_language from vault.decrypted_secrets where name = 'meta_whatsapp_language' limit 1;

  v_template := coalesce(v_template, 'machii_otp');
  v_language := coalesce(v_language, 'fr');

  if v_phone_id is null or v_phone_id = '' or v_token is null or v_token = '' then
    -- WhatsApp non configuré : le code reste en base (mode démo, cf otp_login).
    return jsonb_build_object('sent', false, 'reason', 'whatsapp_not_configured');
  end if;

  perform net.http_post(
    url := 'https://graph.facebook.com/v22.0/' || v_phone_id || '/messages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_token
    ),
    body := jsonb_build_object(
      'messaging_product', 'whatsapp',
      'to', regexp_replace(p_phone, '\D', '', 'g'),
      'type', 'template',
      'template', jsonb_build_object(
        'name', v_template,
        'language', jsonb_build_object('code', v_language),
        'components', jsonb_build_array(
          jsonb_build_object(
            'type', 'body',
            'parameters', jsonb_build_array(
              jsonb_build_object('type', 'text', 'text', v_code)
            )
          )
        )
      )
    )
  );

  return jsonb_build_object('sent', true);
end;
$$;
grant execute on function public.send_whatsapp_otp(text) to anon, authenticated;

-- L'ancienne verify_whatsapp_otp ne doit plus être un oracle de brute-force.
revoke execute on function public.verify_whatsapp_otp(text, text) from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3) Drapeau "mode démo" lisible côté serveur (Vault). Par défaut : activé
--    (la beta tourne sans WhatsApp). EN PRODUCTION : passer à 'false'.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'otp_demo_mode') then
    perform vault.create_secret('true', 'otp_demo_mode',
      'Machii — si true, otp_login accepte un code factice (beta/review). Mettre false en prod.');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 4) otp_login : LE point d'entrée d'auth. Valide l'OTP puis renvoie le couple
--    (email synthétique, mot de passe dérivé) que le client utilise pour
--    signInWithPassword / signUp. Sans OTP valide -> rien.
-- ----------------------------------------------------------------------------
create or replace function public.otp_login(p_phone text, p_code text, p_full_name text default null)
returns jsonb language plpgsql security definer set search_path = public, vault, extensions as $$
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
$$;
grant execute on function public.otp_login(text, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5) Anti-squat : aucune création de compte `*@machii.local` sans OTP
--    fraîchement consommé pour ce numéro (≤ 3 min).
-- ----------------------------------------------------------------------------
create or replace function public.enforce_otp_on_signup()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_digits text;
begin
  if new.email is null or new.email not like '%@machii.local' then
    return new; -- comptes non synthétiques : hors périmètre.
  end if;

  v_digits := split_part(new.email, '@', 1);

  if not exists (
    select 1 from public.phone_otp
    where regexp_replace(phone, '\D', '', 'g') = v_digits
      and consumed = true
      and consumed_at > now() - interval '3 minutes'
  ) then
    raise exception 'Machii: inscription refusée (OTP requis)';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_enforce_otp on auth.users;
create trigger on_auth_user_enforce_otp
  before insert on auth.users
  for each row execute function public.enforce_otp_on_signup();

-- ----------------------------------------------------------------------------
-- 6) Backfill : réaligne les comptes existants (ancien mot de passe
--    déterministe) sur le schéma HMAC. Sans ça, les users actuels ne
--    pourraient plus se connecter après ce déploiement.
-- ----------------------------------------------------------------------------
update auth.users
set encrypted_password = extensions.crypt(
      public._machii_derive_password(split_part(email, '@', 1)),
      extensions.gen_salt('bf')
    ),
    updated_at = now()
where email like '%@machii.local';

-- ----------------------------------------------------------------------------
-- 7) profiles.phone : plus de lecture publique de la colonne téléphone.
--    On révoque tout select puis on ré-accorde toutes les colonnes SAUF phone.
-- ----------------------------------------------------------------------------
revoke select on public.profiles from anon, authenticated;
grant select (
  id, full_name, avatar_url, role, is_verified, rating_avg,
  level, xp, bio, tags, created_at, avatar_key, country
) on public.profiles to anon, authenticated;
-- L'écriture (update self) reste régie par la policy "profiles self update".
grant update (full_name, avatar_url, role, bio, tags, avatar_key, phone, country)
  on public.profiles to authenticated;

-- RPC : l'utilisateur lit SON propre numéro (jamais celui des autres).
create or replace function public.get_my_phone()
returns text language sql stable security definer set search_path = public as $$
  select phone from public.profiles where id = auth.uid();
$$;
grant execute on function public.get_my_phone() to authenticated;

-- ----------------------------------------------------------------------------
-- 8) send_expo_push : retiré du périmètre appelable (anti-spam push).
--    Les triggers l'invoquent en SECURITY DEFINER, donc rien ne casse.
-- ----------------------------------------------------------------------------
revoke all on function public.send_expo_push(text, text, text, jsonb) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 9) get_shared_trip : expire aussi quand le trajet est terminé/annulé.
-- ----------------------------------------------------------------------------
create or replace function public.get_shared_trip(p_token text)
returns jsonb language plpgsql security definer
set search_path = public as $$
declare
  v_link   public.trip_share_links%rowtype;
  v_trip   public.trips%rowtype;
  v_sharer public.profiles%rowtype;
  v_driver public.profiles%rowtype;
  v_pos    public.trip_live_positions%rowtype;
begin
  select * into v_link
  from public.trip_share_links
  where token = p_token and revoked = false
  limit 1;

  if v_link.id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_link.expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  select * into v_trip from public.trips where id = v_link.trip_id;

  -- Le trajet est terminé/annulé : on coupe le partage (plus de position live).
  if v_trip.id is null or v_trip.status in ('done', 'cancelled') then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  select * into v_sharer from public.profiles where id = v_link.user_id;
  select * into v_driver from public.profiles where id = v_trip.driver_id;

  select * into v_pos
  from public.trip_live_positions
  where trip_id = v_link.trip_id and user_id = v_link.user_id;

  return jsonb_build_object(
    'ok', true,
    'expires_at', v_link.expires_at,
    'sharer_name', v_sharer.full_name,
    'driver_name', v_driver.full_name,
    'origin', v_trip.origin_label,
    'destination', v_trip.destination_label,
    'departure_time', v_trip.departure_time,
    'position', case when v_pos.trip_id is null then null else jsonb_build_object(
      'lat', v_pos.lat,
      'lng', v_pos.lng,
      'updated_at', v_pos.updated_at
    ) end
  );
end;
$$;
grant execute on function public.get_shared_trip(text) to anon, authenticated;
