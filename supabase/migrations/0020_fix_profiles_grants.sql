-- ============================================================================
-- Machii — Hotfix : `permission denied for table profiles` (code 42501)
--
-- CAUSE : la migration 0018 a remplacé le `GRANT SELECT ON profiles` global par
-- un grant colonne-par-colonne (pour cacher `phone`). Cette liste :
--   1) ne contient pas `phone` (voulu), MAIS
--   2) ne contient pas `gender` (colonne ajoutée APRÈS, en 0019).
-- Or le client lit le profil avec `.select()` = `SELECT *`, donc Postgres tente
-- de lire TOUTES les colonnes (dont phone + gender non autorisées) -> 42501 dès
-- la connexion (authStore.signInWithVerifiedOtp : .update(...).select()).
--
-- CORRECTIF (sans rebuild app) :
--   - `authenticated` (= déjà titulaire d'un compte) récupère un SELECT complet,
--     pour que `SELECT *` fonctionne. RLS continue de filtrer les lignes.
--   - `anon` reste bridé colonne-par-colonne SANS `phone` (l'objectif anti-
--     énumération de numéros via une clé anon volée est préservé) ; on lui ajoute
--     juste `gender` (non sensible, déjà visible via les badges "trajet femmes").
--   - le GRANT UPDATE gagne `gender` (édition du profil = mode femmes).
--
-- NOTE SÉCURITÉ : un utilisateur authentifié peut désormais lire la colonne
-- `phone` des autres profils. C'est un recul mineur (l'app révèle déjà le numéro
-- du conducteur après acceptation). La correction propre = passer les `.select()`
-- du client en listes de colonnes explicites (sans phone) puis re-restreindre
-- `authenticated` ; planifié pour le prochain build (cf cahier des charges).
--
-- Idempotent.
-- ============================================================================

-- 1) authenticated : SELECT complet -> `SELECT *` du client fonctionne.
grant select on public.profiles to authenticated;

-- 2) anon : ajoute uniquement `gender` à sa liste de colonnes (phone reste exclu).
grant select (gender) on public.profiles to anon;

-- 3) UPDATE : ajoute `gender` aux colonnes modifiables par l'utilisateur.
grant update (
  full_name, avatar_url, role, bio, tags, avatar_key, phone, country, gender
) on public.profiles to authenticated;
