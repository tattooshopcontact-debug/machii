-- ============================================================================
-- Machii — M3 Cap Maroc : option "trajet entre femmes uniquement"
--
-- Différenciateur clé identifié par l'audit Maroc : aucun acteur ne propose
-- de covoiturage interurbain 100 % femmes (Pip Pip Yalah ne le fait pas,
-- Wsselni Maak seulement en urbain). Demande culturelle forte au Maghreb.
--
-- - profiles.gender : 'female' | 'male' | null (optionnel, demandé à
--   l'inscription, sert UNIQUEMENT à filtrer les trajets women-only).
-- - trips.women_only : un trajet réservé aux femmes (le conducteur doit
--   être une femme, et seules des passagères peuvent réserver).
--
-- Règle appliquée côté app + garde-fou RLS sur les bookings.
-- ============================================================================

alter table public.profiles
  add column if not exists gender text
  check (gender is null or gender in ('female', 'male'));

alter table public.trips
  add column if not exists women_only boolean not null default false;

-- Index partiel pour la recherche femmes.
create index if not exists trips_women_only_idx
  on public.trips (country, status, departure_time)
  where women_only = true;

-- ----------------------------------------------------------------------------
-- Garde-fou : empêcher un homme de réserver un trajet women-only.
-- (Le filtrage principal se fait côté app, ceci est la ceinture de sécurité.)
-- ----------------------------------------------------------------------------
create or replace function public._enforce_women_only_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_women_only boolean;
  v_gender text;
begin
  select women_only into v_women_only from public.trips where id = new.trip_id;
  if v_women_only is true then
    select gender into v_gender from public.profiles where id = new.passenger_id;
    if v_gender is distinct from 'female' then
      raise exception 'Ce trajet est réservé aux femmes.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_women_only_booking on public.bookings;
create trigger enforce_women_only_booking
  before insert on public.bookings
  for each row execute function public._enforce_women_only_booking();
