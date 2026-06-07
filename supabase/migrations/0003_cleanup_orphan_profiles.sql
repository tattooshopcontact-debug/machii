-- ============================================================================
-- Machii — Nettoyage des profils orphelins
--
-- Supprime les profils anonymes qui n'ont jamais saisi prénom ni téléphone
-- ET qui n'ont publié aucun trajet ni envoyé aucune demande.
-- Cas typique : sessions Expo Go fantômes, signInAnonymously sans suite.
--
-- Les profils gardés :
--   - ceux avec phone OU full_name renseigné
--   - ceux qui ont publié au moins un trajet (driver_id)
--   - ceux qui ont demandé au moins une réservation (passenger_id)
-- ============================================================================

delete from public.profiles
where (phone is null and (full_name is null or full_name = ''))
  and id not in (select distinct driver_id from public.trips)
  and id not in (select distinct passenger_id from public.bookings);
