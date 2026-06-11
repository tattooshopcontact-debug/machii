-- ============================================================================
-- Machii — Cap Maroc M1 : fondation multi-pays
--
-- Ajoute un code pays ISO-3166 alpha-2 ('TN' | 'MA') sur :
--   - profiles  : pays de l'utilisateur, déduit du préfixe tel (+216/+212)
--   - trips     : pays du trajet (déduit de la ville de départ)
--   - trip_requests : pays de la demande
--
-- Les données existantes sont toutes tunisiennes -> default 'TN'.
-- search_trips gagne un paramètre p_country (cloisonnement M2).
-- ============================================================================

alter table public.profiles
  add column if not exists country text not null default 'TN'
  check (country in ('TN', 'MA'));

alter table public.trips
  add column if not exists country text not null default 'TN'
  check (country in ('TN', 'MA'));

alter table public.trip_requests
  add column if not exists country text not null default 'TN'
  check (country in ('TN', 'MA'));

-- Index pour le cloisonnement des recherches par pays.
create index if not exists trips_country_status_idx
  on public.trips (country, status, departure_time);

create index if not exists trip_requests_country_open_idx
  on public.trip_requests (country, status, departure_start)
  where status = 'open';

-- search_trips : on remplace l'ancienne signature (5 params) par la nouvelle
-- (6 params avec p_country default 'TN') pour éviter toute surcharge ambiguë.
drop function if exists public.search_trips(float, float, float, float, int);

create or replace function public.search_trips(
  p_origin_lng float, p_origin_lat float,
  p_dest_lng float,   p_dest_lat float,
  p_radius_m int default 5000,
  p_country text default 'TN'
)
returns setof public.trips language sql stable as $$
  select *
  from public.trips t
  where t.status = 'open'
    and t.seats_available > 0
    and t.country = p_country
    and st_dwithin(t.origin,      st_point(p_origin_lng, p_origin_lat)::geography, p_radius_m)
    and st_dwithin(t.destination, st_point(p_dest_lng,   p_dest_lat)::geography,   p_radius_m)
  order by t.origin <-> st_point(p_origin_lng, p_origin_lat)::geography,
           t.departure_time asc;
$$;

grant execute on function public.search_trips(float, float, float, float, int, text) to anon, authenticated;
