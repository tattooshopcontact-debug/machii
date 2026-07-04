-- ============================================================================
-- Machii — Réception des webhooks de statut WhatsApp (diagnostic livraison)
-- Meta n'expose les statuts de livraison (delivered/failed + raison) QUE via
-- webhook. Un Cloudflare Worker relaie chaque événement ici via la RPC anon.
-- Table interne (RLS deny) ; jetable une fois le diagnostic terminé.
-- ============================================================================

create table if not exists public.whatsapp_webhook_log (
  id         uuid primary key default gen_random_uuid(),
  payload    jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.whatsapp_webhook_log enable row level security;
drop policy if exists "wa webhook deny" on public.whatsapp_webhook_log;
create policy "wa webhook deny" on public.whatsapp_webhook_log for select using (false);

create or replace function public.wa_webhook_log(p jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.whatsapp_webhook_log (payload) values (p);
$$;
grant execute on function public.wa_webhook_log(jsonb) to anon, authenticated;
