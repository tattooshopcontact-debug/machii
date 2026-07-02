-- ============================================================================
-- Machii — option "trajet entre hommes uniquement" (symétrique de women_only, 0019)
--
-- Permet à un homme de proposer/réserver un trajet réservé aux hommes
-- (demande culturelle : éviter les tensions familiales). L'option n'est
-- montrée qu'aux profils 'male' côté UI ; ici = garde-fou RLS sur bookings.
-- Idempotent.
-- ============================================================================

alter table public.trips
  add column if not exists men_only boolean not null default false;

create index if not exists trips_men_only_idx
  on public.trips (country, status, departure_time)
  where men_only = true;

create or replace function public._enforce_men_only_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_men_only boolean;
  v_gender text;
begin
  select men_only into v_men_only from public.trips where id = new.trip_id;
  if v_men_only is true then
    select gender into v_gender from public.profiles where id = new.passenger_id;
    if v_gender is distinct from 'male' then
      raise exception 'Ce trajet est réservé aux hommes.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_men_only_booking on public.bookings;
create trigger enforce_men_only_booking
  before insert on public.bookings
  for each row execute function public._enforce_men_only_booking();
