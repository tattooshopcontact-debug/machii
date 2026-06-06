-- ============================================================================
-- Machii — V0 : suppression de la contrainte UNIQUE sur profiles.phone
--
-- En V0 (sans Twilio), chaque tentative d'inscription crée un nouveau user
-- anonyme via signInAnonymously(). Sans vraie vérification SMS, on n'a pas
-- d'unicité réelle du numéro côté auth, donc on bloque les ré-inscriptions
-- de test pour rien (erreur 23505 profiles_phone_key).
--
-- À remettre quand on branchera Twilio : l'unicité sera garantie côté
-- supabase.auth.signInWithOtp({phone}) qui re-loggue le même user.
-- ============================================================================

alter table public.profiles drop constraint if exists profiles_phone_key;

-- Nettoyage optionnel : supprime les profils anonymes "orphelins" (sans phone
-- et sans full_name) créés lors des tests précédents. Garde au moins le profil
-- créé via le test E2E pour ne pas vider la base.
-- (Décommenter si tu veux faire le ménage)
-- delete from public.profiles where phone is null and (full_name = '' or full_name is null);
