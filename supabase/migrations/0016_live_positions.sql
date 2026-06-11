-- ============================================================================
-- Machii — Décision cadrage #11 : partage de trajet en temps réel (opt-in)
--
-- Le conducteur peut partager sa position pendant un trajet. Les passagers
-- dont la réservation est acceptée la voient en direct sur la carte du
-- trajet (Supabase Realtime sur cette table).
--
-- Choix : foreground uniquement côté app (pas de background tracking pour
-- ne pas déclencher la déclaration localisation arrière-plan du Play Store).
-- Une seule ligne par (trip, user) — upsert à chaque tick (~15 s).
-- ============================================================================

create table if not exists public.trip_live_positions (
  trip_id     uuid not null references public.trips(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  lat         double precision not null,
  lng         double precision not null,
  /** Vitesse en m/s si dispo (affichage ETA futur). */
  speed       double precision,
  updated_at  timestamptz not null default now(),
  primary key (trip_id, user_id)
);

alter table public.trip_live_positions enable row level security;

-- Le conducteur (ou n'importe quel participant) écrit SA position sur CE trajet.
drop policy if exists "live_positions self write" on public.trip_live_positions;
create policy "live_positions self write"
  on public.trip_live_positions
  for insert
  with check (user_id = auth.uid());

drop policy if exists "live_positions self update" on public.trip_live_positions;
create policy "live_positions self update"
  on public.trip_live_positions
  for update
  using (user_id = auth.uid());

drop policy if exists "live_positions self delete" on public.trip_live_positions;
create policy "live_positions self delete"
  on public.trip_live_positions
  for delete
  using (user_id = auth.uid());

-- Lecture : le conducteur du trajet + les passagers dont la réservation est
-- acceptée. (Pas de lecture publique : la position est une donnée sensible.)
drop policy if exists "live_positions parties read" on public.trip_live_positions;
create policy "live_positions parties read"
  on public.trip_live_positions
  for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.driver_id = auth.uid()
    )
    or exists (
      select 1 from public.bookings b
      where b.trip_id = trip_live_positions.trip_id
        and b.passenger_id = auth.uid()
        and b.status in ('accepted', 'completed')
    )
  );

-- Realtime : publier les changements de cette table.
do $$
begin
  alter publication supabase_realtime add table public.trip_live_positions;
exception when duplicate_object then
  null;
end $$;
