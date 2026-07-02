-- ============================================================================
-- Machii — Profil : ville + préférences par défaut (fumeur, musique, animaux, chat)
--
-- Le membre peut renseigner sa ville et ses préférences par défaut depuis son
-- profil (site + app). Ces prefs servent de valeurs par défaut à ses trajets.
-- Complète les prefs par-trajet de `trips` (0032). Idempotent.
-- ============================================================================

alter table public.profiles
  add column if not exists city         text,
  add column if not exists pref_smoking boolean not null default false,
  add column if not exists pref_music   boolean not null default true,
  add column if not exists pref_pets    boolean not null default false,
  add column if not exists pref_chat    text;

alter table public.profiles drop constraint if exists profiles_pref_chat_chk;
alter table public.profiles
  add constraint profiles_pref_chat_chk
  check (pref_chat is null or pref_chat in ('quiet', 'normal', 'chatty'));

-- Colonnes non sensibles du propre profil (lues via la policy self existante).
