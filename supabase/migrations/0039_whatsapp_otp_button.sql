-- ============================================================================
-- Machii — Adapter send_whatsapp_otp au template AUTHENTICATION approuvé
--
-- Le template machii_otp (id 983304951132675, APPROVED, cat. AUTHENTICATION, fr)
-- impose un BODY {{1}} + un BOUTON OTP "Copier le code". L'ancien appel (body seul)
-- serait rejeté. On ajoute le composant button (sub_type url, index 0, code en param).
-- Payload validé par test Meta (plus d'erreur de template).
-- Idempotent (create or replace). Conserve le log request_id (migration 0038).
-- ============================================================================

create or replace function public.send_whatsapp_otp(p_phone text)
returns jsonb language plpgsql security definer set search_path = public, vault, extensions, net as $$
declare
  v_code text;
  v_phone_id text;
  v_token text;
  v_template text;
  v_language text;
  v_req_id bigint;
begin
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
    return jsonb_build_object('sent', false, 'reason', 'whatsapp_not_configured');
  end if;

  v_req_id := net.http_post(
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
          -- BODY : le code
          jsonb_build_object(
            'type', 'body',
            'parameters', jsonb_build_array(
              jsonb_build_object('type', 'text', 'text', v_code)
            )
          ),
          -- BOUTON OTP "Copier le code" : le code (requis par le template Authentication)
          jsonb_build_object(
            'type', 'button',
            'sub_type', 'url',
            'index', '0',
            'parameters', jsonb_build_array(
              jsonb_build_object('type', 'text', 'text', v_code)
            )
          )
        )
      )
    )
  );

  insert into public.whatsapp_send_log (phone, request_id) values (p_phone, v_req_id);

  return jsonb_build_object('sent', true, 'request_id', v_req_id);
end;
$$;

grant execute on function public.send_whatsapp_otp(text) to anon, authenticated;
