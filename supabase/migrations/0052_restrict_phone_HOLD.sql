-- ============================================================================
-- Machii — ⚠️ NE PAS APPLIQUER AVANT LE ROLLOUT DU BUILD FINAL ⚠️
--
-- Referme le hotfix 0020 : `authenticated` perd le SELECT global sur profiles
-- (qui exposait `phone` de tous les membres) et repasse en grant
-- colonne-par-colonne SANS phone.
--
-- PRÉREQUIS (fait le 2026-07-04) : plus AUCUN `SELECT *` sur profiles dans les
-- clients — app (authStore/profile.ts → PROFILE_COLS_NO_PHONE) et site
-- (getMyProfile → colonnes explicites + RPC get_my_phone).
-- ⚠️ Les BUILDS ANTÉRIEURS de l'app (≤ v15) font encore SELECT * → 42501 à la
-- connexion si on applique trop tôt. Appliquer quand le build final est déployé
-- et adopté par les testeurs. Fichier suffixé _HOLD pour éviter tout apply
-- automatique par lot.
--
-- Idempotent.
-- ============================================================================

revoke select on public.profiles from authenticated;

grant select (
  id, full_name, avatar_url, avatar_key, role, is_verified, is_admin, is_suspended,
  rating_avg, level, xp, bio, tags, country, gender, city,
  referral_code, referred_by, created_at,
  pref_smoking, pref_music, pref_pets, pref_chat
) on public.profiles to authenticated;

-- L'utilisateur lit SON numéro via get_my_phone() (0018) ; l'admin via les RPCs
-- admin_* (SECURITY DEFINER). Aucune lecture directe de `phone` ne subsiste.
