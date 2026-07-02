-- ============================================================================
-- Machii — Log des envois WhatsApp Cloud API (diagnostic erreurs Graph)
--
-- send_whatsapp_otp faisait `perform net.http_post(...)` → réponse jetée, aucun
-- moyen de voir les erreurs (#133010 numéro non enregistré, pas de paiement…).
-- On capture le request_id pg_net et on le logue → jointure avec net._http_response
-- pour lire status_code + content (code Graph + message + fbtrace_id).
-- Idempotent.
-- ============================================================================

create table if not exists public.whatsapp_send_log (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  request_id  bigint,
  created_at  timestamptz not null default now()
);
alter table public.whatsapp_send_log enable row level security;
-- Table interne : personne en anon/authenticated ne la lit (écrite par la RPC security definer).
drop policy if exists "whatsapp_send_log deny all" on public.whatsapp_send_log;
create policy "whatsapp_send_log deny all" on public.whatsapp_send_log for select using (false);

-- ----------------------------------------------------------------------------
-- send_whatsapp_otp : capture le request_id + le logue. Payload inchangé
-- (template body + 1 param), config lue depuis le Vault. Phone Number ID à jour
-- = 1077364005458401 (mis à jour dans vault.secrets hors migration).
-- ----------------------------------------------------------------------------
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

  insert into public.whatsapp_send_log (phone, request_id) values (p_phone, v_req_id);

  return jsonb_build_object('sent', true, 'request_id', v_req_id);
end;
$$;

grant execute on function public.send_whatsapp_otp(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Diagnostic : lit la réponse Graph API des derniers envois (admin/debug only).
-- (status_code, error_msg, content contenant le code d'erreur Meta + fbtrace_id)
-- ----------------------------------------------------------------------------
create or replace function public.whatsapp_last_send_status(p_limit int default 10)
returns table (phone text, request_id bigint, sent_at timestamptz, status_code int, error_msg text, content text)
language sql security definer set search_path = public, net, extensions as $$
  select l.phone, l.request_id, l.created_at, r.status_code, r.error_msg, left(r.content, 800)
  from public.whatsapp_send_log l
  left join net._http_response r on r.id = l.request_id
  order by l.created_at desc
  limit p_limit;
$$;
revoke all on function public.whatsapp_last_send_status(int) from public, anon, authenticated;
