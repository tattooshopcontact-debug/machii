-- ============================================================================
-- Machii — CORRECTIF SÉCURITÉ : garde-fou sur les notes (ratings)
--
-- Faille : l'ancienne policy "ratings author insert" ne vérifiait QUE
-- auth.uid() = rater_id → on pouvait noter n'importe qui, s'auto-noter, et
-- farmer +5 XP en boucle via des trajets bidon. Même classe que 0033 (bookings).
--
-- Correctif : une note n'est autorisée que s'il existe un booking 'completed'
-- reliant réellement le noteur et le noté sur ce trajet, et jamais soi-même.
-- Base partagée app + site. Idempotent.
-- ============================================================================

drop policy if exists "ratings author insert" on public.ratings;

create policy "ratings author insert" on public.ratings for insert
  with check (
    auth.uid() = rater_id
    and rater_id <> ratee_id
    and exists (
      select 1
      from public.bookings b
      join public.trips t on t.id = b.trip_id
      where b.trip_id = ratings.trip_id
        and b.status = 'completed'
        and (
          (b.passenger_id = auth.uid() and t.driver_id = ratee_id)
          or (t.driver_id = auth.uid() and b.passenger_id = ratee_id)
        )
    )
  );
