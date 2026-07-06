-- Machii — Correction péages : valeurs ALLER SIMPLE réalistes (un covoiturage = un sens).
-- Faouez a signalé que 7 DT Tunis→Sousse était trop haut (c'était ~l'aller-retour).
-- Sources : Tunis→Sousse ~2-5 DT aller simple (station Sousse supprimée 07/2025).
-- ⚠️ TOUJOURS des ESTIMATIONS : le barème officiel exact (JORT arrêté 346/2025) est en images.
--    À remplacer par les valeurs officielles Tunisie Autoroutes quand on les aura (tâche data, pas code).

update public.toll_rates set amount = 3.500, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Sousse';
update public.toll_rates set amount = 9.000, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Sfax';
update public.toll_rates set amount = 4.000, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Msaken';
update public.toll_rates set amount = 2.000, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Hammamet';
update public.toll_rates set amount = 3.000, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Enfidha';
update public.toll_rates set amount = 1.500, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Bizerte';
update public.toll_rates set amount = 1.500, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Oued Zarga';
update public.toll_rates set amount = 4.500, updated_at = now() where country='TN' and city_a='Sousse' and city_b='Sfax';
