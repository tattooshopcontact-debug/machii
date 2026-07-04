-- ============================================================================
-- Machii — Durcissements issus de l'audit sécurité console admin (2026-07-04)
--
-- 1. Suspension : étendue aux UPDATE (un suspendu ne peut plus non plus
--    modifier/rouvrir ses trajets, résas, messages, demandes existants).
--    Les RPCs admin (SECURITY DEFINER) passent car auth.uid() = l'admin.
-- 2. wa_webhook_log : exige désormais une clé partagée (Vault `wa_webhook_key`)
--    — ferme l'injection anonyme de faux événements de livraison.
-- Idempotent.
-- ============================================================================

-- 1. Suspension aussi sur UPDATE ----------------------------------------------------
drop trigger if exists trg_suspended_trips_upd on public.trips;
create trigger trg_suspended_trips_upd before update on public.trips
  for each row execute function public._assert_not_suspended();
drop trigger if exists trg_suspended_bookings_upd on public.bookings;
create trigger trg_suspended_bookings_upd before update on public.bookings
  for each row execute function public._assert_not_suspended();
drop trigger if exists trg_suspended_messages_upd on public.messages;
create trigger trg_suspended_messages_upd before update on public.messages
  for each row execute function public._assert_not_suspended();
drop trigger if exists trg_suspended_requests_upd on public.trip_requests;
create trigger trg_suspended_requests_upd before update on public.trip_requests
  for each row execute function public._assert_not_suspended();

-- 2. Webhook : clé partagée obligatoire ----------------------------------------------
-- L'ancienne signature (payload seul) est supprimée ; le Worker Cloudflare envoie
-- désormais p_key, comparée au secret Vault. Sans clé valide → rien n'est inséré.
drop function if exists public.wa_webhook_log(jsonb);

create or replace function public.wa_webhook_log(p jsonb, p_key text)
returns void language plpgsql security definer set search_path = public, vault as $$
declare
  v_key text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'wa_webhook_key' limit 1;
  if v_key is null or v_key = '' or p_key is distinct from v_key then
    return; -- clé absente/incorrecte : on ignore silencieusement (pas d'oracle)
  end if;
  insert into public.whatsapp_webhook_log (payload) values (p);
end;
$$;
grant execute on function public.wa_webhook_log(jsonb, text) to anon, authenticated;
