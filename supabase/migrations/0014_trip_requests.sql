-- ============================================================================
-- Machii — V1.1 : demandes de trajet (passager -> conducteurs)
--
-- Les passagers qui ne trouvent pas de trajet sur leur itineraire peuvent
-- publier une "demande" : Origin -> Destination, fourchette d horaire, places
-- souhaitees, message court. Les conducteurs voient ces demandes ouvertes
-- depuis leur accueil et peuvent y repondre en proposant un trajet via le chat.
-- ============================================================================

create table if not exists public.trip_requests (
  id                  uuid primary key default gen_random_uuid(),
  passenger_id        uuid not null references public.profiles(id) on delete cascade,

  origin_label        text not null,
  destination_label   text not null,
  origin              geography(point) not null,
  destination         geography(point) not null,

  /** Plage horaire souhaitee : depart entre start et end. */
  departure_start     timestamptz not null,
  departure_end       timestamptz not null,

  seats_needed        int not null default 1 check (seats_needed between 1 and 6),
  message             text,
  status              text not null default 'open' check (status in ('open', 'matched', 'cancelled')),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists trip_requests_open_idx
  on public.trip_requests (status, departure_start)
  where status = 'open';

create index if not exists trip_requests_passenger_idx
  on public.trip_requests (passenger_id, created_at desc);

-- Trigger updated_at.
create or replace function public._trip_requests_touch()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trip_requests_touch on public.trip_requests;
create trigger trip_requests_touch
  before update on public.trip_requests
  for each row execute function public._trip_requests_touch();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.trip_requests enable row level security;

drop policy if exists "trip_requests open visible to drivers" on public.trip_requests;
create policy "trip_requests open visible to drivers"
  on public.trip_requests
  for select
  using (
    status = 'open'
    OR passenger_id = auth.uid()
  );

drop policy if exists "trip_requests passenger insert" on public.trip_requests;
create policy "trip_requests passenger insert"
  on public.trip_requests
  for insert
  with check (passenger_id = auth.uid());

drop policy if exists "trip_requests passenger update" on public.trip_requests;
create policy "trip_requests passenger update"
  on public.trip_requests
  for update
  using (passenger_id = auth.uid());

drop policy if exists "trip_requests passenger delete" on public.trip_requests;
create policy "trip_requests passenger delete"
  on public.trip_requests
  for delete
  using (passenger_id = auth.uid());
