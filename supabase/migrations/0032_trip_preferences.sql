-- ============================================================================
-- Machii — Préférences / conditions d'un trajet (fumeur, musique, animaux, chat)
--
-- Le conducteur précise ses conditions ; le passager les voit AVANT de demander
-- à réserver. Complète `women_only` (0019) et `is_recurring` (0001).
-- Idempotent.
-- ============================================================================

alter table public.trips
  add column if not exists allow_smoking boolean not null default false,   -- fumeur autorisé ? (défaut : non-fumeur)
  add column if not exists allow_music   boolean not null default true,    -- musique à bord
  add column if not exists allow_pets    boolean not null default false,   -- animaux acceptés
  add column if not exists chat_level    text;                             -- 'quiet' | 'normal' | 'chatty'

alter table public.trips
  drop constraint if exists trips_chat_level_chk;
alter table public.trips
  add constraint trips_chat_level_chk
  check (chat_level is null or chat_level in ('quiet', 'normal', 'chatty'));

-- Ces colonnes sont publiques (comme le reste du trajet) : aucune RLS spécifique.
-- La lecture passe par les policies existantes de `trips`.

-- ----------------------------------------------------------------------------
-- Démo : variété déterministe sur les trajets ouverts existants pour que les
-- annonces affichent des conditions réalistes (Khouloud, Yo, etc.).
-- ----------------------------------------------------------------------------
update public.trips set
  allow_smoking = (abs(hashtext(id::text)) % 5 = 0),      -- ~20 % fumeur autorisé
  allow_music   = (abs(hashtext(id::text)) % 3 <> 0),     -- ~66 % musique
  allow_pets    = (abs(hashtext(id::text)) % 4 = 0),      -- ~25 % animaux OK
  chat_level    = (array['quiet','normal','chatty'])[(abs(hashtext(id::text)) % 3) + 1]
where status = 'open';
