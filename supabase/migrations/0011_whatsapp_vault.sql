-- ============================================================================
-- Machii — refactor send_whatsapp_otp pour lire depuis Supabase Vault
--
-- La 0010 lisait via current_setting('app.meta_whatsapp_*') ce qui necessite
-- ALTER DATABASE — interdit a l'user `postgres.<projectref>` sur Supabase
-- managed. On stocke les secrets dans vault.secrets a la place, methode
-- officielle Supabase pour les credentials backend.
--
-- Les secrets eux-memes sont inseres hors migration (cf scripts/configure_meta_vault.js).
-- Cette migration ne fait que refactor la fonction.
-- ============================================================================

create or replace function public.send_whatsapp_otp(p_phone text)
returns jsonb language plpgsql security definer set search_path = public, vault, extensions as $$
declare
  v_code text;
  v_phone_id text;
  v_token text;
  v_template text;
  v_language text;
begin
  v_code := lpad((floor(random() * 900000) + 100000)::text, 6, '0');

  insert into public.phone_otp (phone, code, expires_at)
  values (p_phone, v_code, now() + interval '10 minutes');

  -- Lit la config depuis le Vault Supabase (chiffre, accessible uniquement en security definer).
  select decrypted_secret into v_phone_id from vault.decrypted_secrets where name = 'meta_whatsapp_phone_id' limit 1;
  select decrypted_secret into v_token    from vault.decrypted_secrets where name = 'meta_whatsapp_token'    limit 1;
  select decrypted_secret into v_template from vault.decrypted_secrets where name = 'meta_whatsapp_template' limit 1;
  select decrypted_secret into v_language from vault.decrypted_secrets where name = 'meta_whatsapp_language' limit 1;

  v_template := coalesce(v_template, 'machii_otp');
  v_language := coalesce(v_language, 'fr');

  -- Pas configure → DEV/V0 : code juste log en DB.
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
