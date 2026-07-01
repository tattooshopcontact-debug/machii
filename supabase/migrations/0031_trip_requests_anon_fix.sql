-- ============================================================================
-- 0031 — Fix sécurité (audit RLS 2026-07-01).
-- La policy "open visible to drivers" de 0014 autorisait la lecture de TOUTE
-- demande status='open' SANS restreindre au rôle authenticated → un attaquant
-- ANON (clé publique) lisait passenger_id + coordonnées GPS (origin/destination)
-- + créneaux horaires de tous les passagers. On restreint aux AUTHENTIFIÉS.
-- Idempotent.
-- ============================================================================

alter table public.trip_requests enable row level security;

-- Coupe l'accès anon direct s'il existe.
revoke all on public.trip_requests from anon;

-- Lecture : uniquement les utilisateurs CONNECTÉS (conducteurs voient les
-- demandes ouvertes ; le passager voit les siennes).
drop policy if exists "trip_requests open visible to drivers" on public.trip_requests;
create policy "trip_requests open visible to drivers"
  on public.trip_requests
  for select
  to authenticated
  using (status = 'open' OR passenger_id = auth.uid());

-- Insert / update / delete : passager propriétaire, connecté uniquement.
drop policy if exists "trip_requests passenger insert" on public.trip_requests;
create policy "trip_requests passenger insert"
  on public.trip_requests for insert to authenticated
  with check (passenger_id = auth.uid());

drop policy if exists "trip_requests passenger update" on public.trip_requests;
create policy "trip_requests passenger update"
  on public.trip_requests for update to authenticated
  using (passenger_id = auth.uid());

drop policy if exists "trip_requests passenger delete" on public.trip_requests;
create policy "trip_requests passenger delete"
  on public.trip_requests for delete to authenticated
  using (passenger_id = auth.uid());
