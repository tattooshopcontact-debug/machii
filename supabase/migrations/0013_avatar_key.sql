-- ============================================================================
-- Machii — Avatars personnalisables debloquables (style Waze)
--
-- profiles.avatar_key : cle vers un des 8 avatars Machii integres au bundle
-- (assets/avatars/01_voyageur.png … 08_legende.png).
-- NULL = pas de choix explicite (fallback initiale dans le composant Avatar).
--
-- Le deblocage est calcule cote app a partir de level, xp, rating_avg, role
-- et de l etat KYC. La colonne ici stocke juste la PREFERENCE du user.
-- ============================================================================

alter table public.profiles
  add column if not exists avatar_key text;

-- Verifie qu une cle valide est saisie (ou null).
alter table public.profiles
  drop constraint if exists profiles_avatar_key_check;

alter table public.profiles
  add constraint profiles_avatar_key_check
  check (avatar_key is null or avatar_key in (
    'voyageur', 'regulier', 'conducteur', 'verifie',
    'confiance', 'veteran', 'ambassadeur', 'legende'
  ));
