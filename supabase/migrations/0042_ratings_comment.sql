-- ============================================================================
-- Machii — Avis écrit (style Airbnb) : commentaire libre sur une notation.
--
-- Les notations (4 critères 1-5) existent déjà et sont publiquement lisibles
-- (policy "ratings readable" using(true), 0001). On ajoute un commentaire
-- texte affiché publiquement sur le profil de la personne notée.
-- Le caractère OBLIGATOIRE est appliqué côté app (le champ reste nullable pour
-- ne pas casser les notations historiques).
-- Idempotent.
-- ============================================================================

alter table public.ratings add column if not exists comment text;
