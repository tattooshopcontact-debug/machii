-- ============================================================================
-- Machii — WhatsApp OTP via Meta Cloud API
--
-- Table phone_otp : code 6 chiffres associe a un numero, ttl 10 min.
-- Fonction send_whatsapp_otp(phone) : genere le code, l'enregistre, envoie
-- le message via Meta WhatsApp Cloud API (gratuit 1000 conv/mois).
--
-- Prerequis pour activer :
--   1) Compte Meta dev + verif numero emetteur
--   2) Variables d'env cote Supabase :
--      - meta_whatsapp_phone_id    (depuis app Meta business)
--      - meta_whatsapp_token       (access token long-life)
--      - meta_whatsapp_template    (nom du template "machii_otp" approuve)
--   3) Activer pg_net (deja fait en 0006)
--
-- En V0 fake OTP (tant que ces variables ne sont pas renseignees), la fonction
-- se contente d'enregistrer le code 6 chiffres en DB. L'app peut alors le lire
-- via une RPC pour les tests. En production, le code est envoye via WhatsApp.
-- ============================================================================

-- Table de stockage des codes OTP.
create table if not exists public.phone_otp (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  code        text not null,
  expires_at  timestamptz not null,
  consumed    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists phone_otp_phone_idx on public.phone_otp (phone, created_at desc);

alter table public.phone_otp enable row level security;
-- Personne en mode public ne lit la table directement : tout passe par les RPCs.
drop policy if exists "phone_otp deny all" on public.phone_otp;
create policy "phone_otp deny all" on public.phone_otp for select using (false);

-- ----------------------------------------------------------------------------
-- send_whatsapp_otp(phone) : appelable en RPC public (anon)
-- ----------------------------------------------------------------------------
create or replace function public.send_whatsapp_otp(p_phone text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_code text;
  v_phone_id text;
  v_token text;
  v_template text;
  v_response jsonb;
begin
  -- Genere un code 6 chiffres (100000-999999).
  v_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');

  insert into public.phone_otp (phone, code, expires_at)
  values (p_phone, v_code, now() + interval '10 minutes');

  -- Recupere la config Meta depuis app.settings (vault) si renseignee.
  begin
    v_phone_id := current_setting('app.meta_whatsapp_phone_id', true);
    v_token    := current_setting('app.meta_whatsapp_token', true);
    v_template := coalesce(current_setting('app.meta_whatsapp_template', true), 'machii_otp');
  exception when others then
    v_phone_id := null;
  end;

  -- Si pas configure, on log juste le code (DEV / V0).
  if v_phone_id is null or v_phone_id = '' or v_token is null or v_token = '' then
    return jsonb_build_object('sent', false, 'reason', 'whatsapp_not_configured');
  end if;

  -- POST vers Meta WhatsApp Cloud API.
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
        'language', jsonb_build_object('code', 'fr'),
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

-- ----------------------------------------------------------------------------
-- verify_whatsapp_otp(phone, code) : appelable en RPC public, retourne true/false
-- Marque le code comme consume si valide.
-- ----------------------------------------------------------------------------
create or replace function public.verify_whatsapp_otp(p_phone text, p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.phone_otp
  where phone = p_phone
    and code = p_code
    and consumed = false
    and expires_at > now()
  order by created_at desc
  limit 1;

  if v_id is null then
    return false;
  end if;

  update public.phone_otp set consumed = true where id = v_id;
  return true;
end;
$$;

grant execute on function public.verify_whatsapp_otp(text, text) to anon, authenticated;
