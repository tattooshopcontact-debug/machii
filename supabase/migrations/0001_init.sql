-- ============================================================================
-- Machii — Schéma initial (Supabase / PostgreSQL + PostGIS)
-- Covoiturage Tunisie. Modèle GRATUIT (loi n° 2004-33).
-- À appliquer : supabase db push  (ou coller dans le SQL editor).
-- ============================================================================

create extension if not exists postgis with schema extensions;

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type role_type      as enum ('passenger', 'driver', 'both');
create type trip_status     as enum ('open', 'full', 'ongoing', 'done', 'cancelled');
create type booking_status  as enum ('pending', 'accepted', 'rejected', 'cancelled', 'completed');
create type kyc_doc_type    as enum ('cin', 'permis', 'carte_grise', 'photo_vehicule');
create type kyc_status      as enum ('pending', 'approved', 'rejected');

-- ----------------------------------------------------------------------------
-- PROFILES (1-1 avec auth.users)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  phone        text unique,
  full_name    text not null default '',
  avatar_url   text,
  role         role_type not null default 'passenger',
  is_verified  boolean not null default false,
  rating_avg   numeric(2,1) not null default 0,
  level        int not null default 1,
  xp           int not null default 0,
  bio          text,
  tags         text[] not null default '{}',
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- VEHICLES
-- ----------------------------------------------------------------------------
create table public.vehicles (
  id         uuid primary key default gen_random_uuid(),
  driver_id  uuid not null references public.profiles(id) on delete cascade,
  make       text,
  model      text,
  color      text,
  plate      text,
  seats      int not null default 4,
  photo_url  text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TRIPS (PostGIS : origin / destination / route)
-- ----------------------------------------------------------------------------
create table public.trips (
  id              uuid primary key default gen_random_uuid(),
  driver_id       uuid not null references public.profiles(id) on delete cascade,
  vehicle_id      uuid references public.vehicles(id) on delete set null,
  origin_label    text not null,
  destination_label text not null,
  origin          geography(Point, 4326) not null,
  destination     geography(Point, 4326) not null,
  route           geography(LineString, 4326),
  departure_time  timestamptz not null,
  seats_available int not null default 1,
  seats_total     int not null default 1,
  -- prix par place en DT. NULL = à négocier, 0 = gratuit.
  price_per_seat  int,
  status          trip_status not null default 'open',
  is_recurring    boolean not null default false,
  created_at      timestamptz not null default now()
);
create index trips_origin_gix      on public.trips using gist (origin);
create index trips_destination_gix on public.trips using gist (destination);
create index trips_route_gix       on public.trips using gist (route);
create index trips_departure_idx   on public.trips (departure_time);

-- Étapes intermédiaires (waypoint matching)
create table public.trip_waypoints (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  point       geography(Point, 4326) not null,
  label       text,
  order_index int not null default 0
);
create index trip_waypoints_gix on public.trip_waypoints using gist (point);

-- ----------------------------------------------------------------------------
-- BOOKINGS / ride_requests
-- ----------------------------------------------------------------------------
create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  passenger_id  uuid not null references public.profiles(id) on delete cascade,
  pickup        geography(Point, 4326),
  dropoff       geography(Point, 4326),
  seats_booked  int not null default 1,
  status        booking_status not null default 'pending',
  -- code de confirmation 4 chiffres symétrique (décisions #12-B / #13)
  confirm_code  text,
  created_at    timestamptz not null default now(),
  unique (trip_id, passenger_id)
);

-- ----------------------------------------------------------------------------
-- CONVERSATIONS / MESSAGES (chat in-app, Realtime)
-- ----------------------------------------------------------------------------
create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  driver_id  uuid not null references public.profiles(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (trip_id, passenger_id)
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  content         text not null,
  -- true si l'anti-contournement a masqué un n° / mot-clé (décision #8)
  blocked         boolean not null default false,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index messages_conv_idx on public.messages (conversation_id, created_at);

-- ----------------------------------------------------------------------------
-- RATINGS (multi-critères, décision #9)
-- ----------------------------------------------------------------------------
create table public.ratings (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  rater_id      uuid not null references public.profiles(id) on delete cascade,
  ratee_id      uuid not null references public.profiles(id) on delete cascade,
  punctuality   int check (punctuality between 1 and 5),
  cleanliness   int check (cleanliness between 1 and 5),
  driving       int check (driving between 1 and 5),
  friendliness  int check (friendliness between 1 and 5),
  created_at    timestamptz not null default now(),
  unique (trip_id, rater_id, ratee_id)
);

-- ----------------------------------------------------------------------------
-- KYC (Storage privé) + SOS
-- ----------------------------------------------------------------------------
create table public.kyc_documents (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  doc_type    kyc_doc_type not null,
  file_path   text not null,
  status      kyc_status not null default 'pending',
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);

create table public.sos_events (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  trip_id     uuid references public.trips(id) on delete set null,
  location    geography(Point, 4326),
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index sos_events_gix on public.sos_events using gist (location);

-- ----------------------------------------------------------------------------
-- TRIGGER : créer un profil à l'inscription auth
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- RPC : recherche de trajets par proximité (PostGIS)
--   longitude EN PREMIER dans st_point().
-- ----------------------------------------------------------------------------
create or replace function public.search_trips(
  p_origin_lng float, p_origin_lat float,
  p_dest_lng float,   p_dest_lat float,
  p_radius_m int default 5000
)
returns setof public.trips language sql stable as $$
  select *
  from public.trips t
  where t.status = 'open'
    and t.seats_available > 0
    and st_dwithin(t.origin,      st_point(p_origin_lng, p_origin_lat)::geography, p_radius_m)
    and st_dwithin(t.destination, st_point(p_dest_lng,   p_dest_lat)::geography,   p_radius_m)
  order by t.origin <-> st_point(p_origin_lng, p_origin_lat)::geography,
           t.departure_time asc;
$$;

-- ----------------------------------------------------------------------------
-- RLS — tout est privé par défaut
-- ----------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.vehicles       enable row level security;
alter table public.trips          enable row level security;
alter table public.trip_waypoints enable row level security;
alter table public.bookings       enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;
alter table public.ratings        enable row level security;
alter table public.kyc_documents  enable row level security;
alter table public.sos_events     enable row level security;

-- Profiles : lecture publique (profils conducteurs visibles), écriture par soi.
create policy "profiles readable" on public.profiles for select using (true);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- Vehicles : le conducteur gère les siens, lecture publique.
create policy "vehicles readable" on public.vehicles for select using (true);
create policy "vehicles owner write" on public.vehicles for all
  using (auth.uid() = driver_id) with check (auth.uid() = driver_id);

-- Trips : lecture publique des trajets ouverts ; le conducteur gère les siens.
create policy "trips readable" on public.trips for select using (true);
create policy "trips owner write" on public.trips for all
  using (auth.uid() = driver_id) with check (auth.uid() = driver_id);

create policy "waypoints readable" on public.trip_waypoints for select using (true);
create policy "waypoints owner write" on public.trip_waypoints for all
  using (exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid()));

-- Bookings : visibles par le passager ET le conducteur du trajet.
create policy "bookings visible to parties" on public.bookings for select using (
  auth.uid() = passenger_id
  or exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid())
);
create policy "bookings passenger insert" on public.bookings for insert
  with check (auth.uid() = passenger_id);
create policy "bookings parties update" on public.bookings for update using (
  auth.uid() = passenger_id
  or exists (select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid())
);

-- Conversations / messages : seulement les 2 membres.
create policy "conv members" on public.conversations for select using (
  auth.uid() = driver_id or auth.uid() = passenger_id
);
create policy "conv create" on public.conversations for insert with check (
  auth.uid() = driver_id or auth.uid() = passenger_id
);
create policy "messages members read" on public.messages for select using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.driver_id = auth.uid() or c.passenger_id = auth.uid())
  )
);
create policy "messages members send" on public.messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.driver_id = auth.uid() or c.passenger_id = auth.uid())
  )
);

-- Ratings : lecture publique (note du profil), écriture par le notant.
create policy "ratings readable" on public.ratings for select using (true);
create policy "ratings author insert" on public.ratings for insert with check (auth.uid() = rater_id);

-- KYC : strictement privé au propriétaire (la modération passe par service_role).
create policy "kyc owner" on public.kyc_documents for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- SOS : le propriétaire crée/voit ; le traitement passe par une Edge Function (service_role).
create policy "sos owner" on public.sos_events for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Realtime sur les messages
alter publication supabase_realtime add table public.messages;
