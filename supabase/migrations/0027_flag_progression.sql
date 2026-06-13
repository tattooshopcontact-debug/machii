-- ============================================================================
-- Machii — Option F8 : écran "Ma progression" (#17). OFF par défaut.
-- Idempotent.
-- ============================================================================
insert into public.feature_flags (key, num, label, version, enabled) values
  ('progression', 8, 'Écran progression (XP, niveau, thèmes)', 'v1.2.0', false)
on conflict (key) do update
  set num = excluded.num, label = excluded.label, version = excluded.version;
