-- ============================================================================
-- Machii — Décision cadrage #11-B : partage de trajet à un proche (opt-in)
--
-- Le PASSAGER (ou le conducteur) partage son trajet en 1 tap : l'app génère
-- un lien web public à durée de vie 4 h. Le proche ouvre le lien SANS compte
-- et voit : infos du trajet + dernière position du partageur (si le partage
-- de position est actif), via la RPC publique get_shared_trip(token).
--
-- Sécurité :
--  - token aléatoire 24 bytes (non devinable), expiration 4 h, révocable
--  - la RPC ne renvoie que des champs limités (pas de téléphone)
--  - SECURITY DEFINER pour lire trips/profiles/positions sans ouvrir les RLS
-- ============================================================================

create table if not exists public.trip_share_links (
  id          uuid primary key default gen_random_uuid(),
  -- Token URL-safe (base64url n'existe pas en PG : on translate +/= vers -_).
  token       text not null unique default translate(encode(gen_random_bytes(18), 'base64'), '+/=', '-_'),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  expires_at  timestamptz not null default now() + interval '4 hours',
  revoked     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists trip_share_links_token_idx on public.trip_share_links (token);

alter table public.trip_share_links enable row level security;

-- Le partageur gère ses propres liens.
drop policy if exists "share_links self all" on public.trip_share_links;
create policy "share_links self all"
  on public.trip_share_links
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RPC publique : lecture d'un trajet partagé via token (anon, sans compte).
-- ----------------------------------------------------------------------------
create or replace function public.get_shared_trip(p_token text)
returns jsonb language plpgsql security definer
set search_path = public as $$
declare
  v_link  public.trip_share_links%rowtype;
  v_trip  public.trips%rowtype;
  v_sharer public.profiles%rowtype;
  v_driver public.profiles%rowtype;
  v_pos   public.trip_live_positions%rowtype;
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
  select * into v_sharer from public.profiles where id = v_link.user_id;
  select * into v_driver from public.profiles where id = v_trip.driver_id;

  -- Dernière position du PARTAGEUR (pas forcément le conducteur).
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
