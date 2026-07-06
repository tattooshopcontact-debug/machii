-- ============================================================================
-- Durcissement sécurité du rôle anon — audit 2026-07-06.
-- Déjà appliqué en prod ; ce fichier versionne le changement (idempotent).
-- ============================================================================

-- #2 — Moindre privilège : un visiteur anonyme ne doit JAMAIS pouvoir
-- supprimer/vider des données, ni poser triggers/FK. RLS neutralisait déjà
-- les writes, mais TRUNCATE contourne RLS → on retire ces droits inutiles.
REVOKE TRUNCATE, TRIGGER, REFERENCES, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

-- #1 — Anti-énumération des profils : anon ne peut plus lire directement
-- genre / bio / rôle / pays de TOUS les utilisateurs (fuite vie privée,
-- surtout le genre pour une app à angle sécurité). anon garde uniquement les
-- colonnes nécessaires à l'affichage des conducteurs dans /annonces
-- (id, full_name, rating_avg, is_verified, level, avatar_key, avatar_url).
-- Le profil public complet reste servi par get_public_profile (SECURITY
-- DEFINER, qui contourne ces grants). Le téléphone / la ville / is_admin
-- étaient déjà masqués.
REVOKE SELECT (gender, bio, role, country) ON public.profiles FROM anon;
