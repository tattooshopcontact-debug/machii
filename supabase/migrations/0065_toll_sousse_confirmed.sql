-- Machii — Péage Tunis→Sousse CONFIRMÉ par donnée terrain (Faouez) :
--   1.400 DT (sortie Tunis / barrière Mornag) + 2.500 DT (entrée Sousse / barrière Hergla, post-juillet 2025) = 3.900 DT.
-- Les autres axes restent des estimations à confirmer (grille officielle + confirmation conducteur).
update public.toll_rates set amount = 3.900, updated_at = now()
 where country='TN' and city_a='Tunis' and city_b='Sousse';
