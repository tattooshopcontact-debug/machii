-- ============================================================================
-- Machii — CORRECTIF SÉCURITÉ : auto-acceptation d'une réservation par le passager
--
-- Faille : la policy "bookings parties update" (0001) autorisait passager OU
-- conducteur à faire un UPDATE sans WITH CHECK. Un passager pouvait donc passer
-- SA réservation de 'pending' à 'accepted' → le trigger trg_gen_pickup_code
-- (0021) générait le code de prise en charge SANS l'accord du conducteur, et
-- déclenchait les effets d'acceptation (conversation, push, positions live…).
--
-- Correctif : on scinde l'UPDATE en deux policies avec WITH CHECK explicite.
--   • Le CONDUCTEUR du trajet gère le statut (accepter / refuser / terminer).
--   • Le PASSAGER ne peut QUE passer sa demande à 'cancelled' (annulation).
--
-- Base partagée app + site. Idempotent.
-- ============================================================================

drop policy if exists "bookings parties update" on public.bookings;
drop policy if exists "bookings driver update" on public.bookings;
drop policy if exists "bookings passenger cancel" on public.bookings;

-- Conducteur du trajet : peut changer le statut de la demande.
create policy "bookings driver update" on public.bookings for update
  using (
    exists (select 1 from public.trips t
            where t.id = trip_id and t.driver_id = auth.uid())
  )
  with check (
    exists (select 1 from public.trips t
            where t.id = trip_id and t.driver_id = auth.uid())
  );

-- Passager : peut UNIQUEMENT annuler sa propre demande (jamais l'accepter).
create policy "bookings passenger cancel" on public.bookings for update
  using (auth.uid() = passenger_id)
  with check (auth.uid() = passenger_id and status = 'cancelled');
