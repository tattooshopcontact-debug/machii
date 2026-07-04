-- ============================================================================
-- Machii — Console admin : onglet Système (serveur, sécurité, audience, OTP, flags)
--
-- admin_system_status() : photo complète de l'état du backend —
--   serveur (taille DB, heure, version), storage par bucket, waitlist
--   (téléchargements pré-lancement), OTP WhatsApp (volumes + derniers statuts
--   de livraison + mode démo), posture sécurité (tables sans RLS), flags.
-- admin_set_flag() : activer/désactiver un feature flag depuis la console.
-- Tout est gated _is_admin(). Idempotent.
-- ============================================================================

create or replace function public.admin_system_status()
returns jsonb language sql stable security definer
set search_path = public, vault, storage, extensions as $$
  select case when not public._is_admin() then null else jsonb_build_object(
    'server', jsonb_build_object(
      'time', now(),
      'pg_version', current_setting('server_version'),
      'db_bytes', pg_database_size(current_database()),
      'db_limit_bytes', 500 * 1024 * 1024
    ),
    'storage', (
      select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket_id, 'files', n, 'bytes', b)), '[]'::jsonb)
      from (select bucket_id, count(*) n, coalesce(sum((metadata->>'size')::bigint),0) b
            from storage.objects group by bucket_id) s
    ),
    'waitlist', jsonb_build_object(
      'total',   (select count(*) from waitlist),
      'android', (select count(*) from waitlist where lower(coalesce(platform,'')) like '%android%'),
      'ios',     (select count(*) from waitlist where lower(coalesce(platform,'')) like '%ios%' or lower(coalesce(platform,'')) like '%iphone%'),
      'last7',   (select count(*) from waitlist where created_at > now() - interval '7 days')
    ),
    'otp', jsonb_build_object(
      'sends_24h',  (select count(*) from whatsapp_send_log where created_at > now() - interval '24 hours'),
      'sends_7d',   (select count(*) from whatsapp_send_log where created_at > now() - interval '7 days'),
      'sends_total',(select count(*) from whatsapp_send_log),
      'demo_mode',  (select decrypted_secret from vault.decrypted_secrets where name = 'otp_demo_mode' limit 1),
      'config_ok',  (select count(*) = 2 from vault.decrypted_secrets
                     where name in ('meta_whatsapp_token','meta_whatsapp_phone_id')
                       and coalesce(decrypted_secret,'') <> ''),
      'recent', (
        select coalesce(jsonb_agg(ev), '[]'::jsonb) from (
          select jsonb_build_object(
                   'at', l.created_at,
                   'status', s->>'status',
                   'to', s->>'recipient_id',
                   'error', coalesce(s->'errors'->0->>'title', s->'errors'->0->>'message')
                 ) as ev
          from whatsapp_webhook_log l,
               lateral jsonb_array_elements(coalesce(l.payload->'entry','[]'::jsonb)) e,
               lateral jsonb_array_elements(coalesce(e->'changes','[]'::jsonb)) ch,
               lateral jsonb_array_elements(coalesce(ch->'value'->'statuses','[]'::jsonb)) s
          order by l.created_at desc
          limit 10
        ) t
      )
    ),
    'security', jsonb_build_object(
      'rls_off', (
        select coalesce(jsonb_agg(tablename), '[]'::jsonb)
        from pg_tables where schemaname = 'public' and not rowsecurity
      ),
      'suspended',   (select count(*) from profiles where is_suspended),
      'reports_open',(select count(*) from reports where status <> 'resolved'),
      'blocked_24h', (select count(*) from messages where blocked and created_at > now() - interval '24 hours')
    ),
    'flags', (
      select coalesce(jsonb_agg(jsonb_build_object('key', key, 'label', label, 'enabled', enabled) order by num), '[]'::jsonb)
      from feature_flags
    )
  ) end;
$$;
revoke all on function public.admin_system_status() from public, anon;
grant execute on function public.admin_system_status() to authenticated;

-- Bascule d'un feature flag depuis la console (tracée au journal)
create or replace function public.admin_set_flag(p_key text, p_enabled boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public._is_admin() then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  update feature_flags set enabled = p_enabled where key = p_key;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  perform _admin_log(case when p_enabled then 'enable_flag' else 'disable_flag' end, 'flag', p_key, null);
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.admin_set_flag(text, boolean) from public, anon;
grant execute on function public.admin_set_flag(text, boolean) to authenticated;
