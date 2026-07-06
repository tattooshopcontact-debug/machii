-- Machii — Péages corrigés depuis la GRILLE OFFICIELLE Tunisie Autoroutes
--   (page https://www.tunisieautoroutes.tn/tarif/, CLASSE 1 / véhicule léger, extraite le 06/07/2026).
-- A1 Nord (entrée Hammam Lif) · A3 (entrée El Fejja) · A4 (entrée Sidi Thabet) = valeurs DIRECTES exactes.
-- Sfax / Gabès / Sousse-Sfax = cumul A1 Nord + A1 Sud (charnière M'saken) → quasi-exact.

-- A1 Nord (exact)
update public.toll_rates set amount = 3.400, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Sousse';    -- Hammam Lif→Sousse
update public.toll_rates set amount = 3.900, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Msaken';    -- Hammam Lif→M'saken
update public.toll_rates set amount = 1.400, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Hammamet';  -- Hammam Lif→Grombalia/Hammamet
update public.toll_rates set amount = 2.400, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Enfidha';
-- A4 (exact)
update public.toll_rates set amount = 1.400, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Bizerte';  -- Sidi Thabet→Menzel Jemil
-- A3 (exact)
update public.toll_rates set amount = 1.800, updated_at = now() where country='TN' and city_a='Tunis' and city_b='Oued Zarga'; -- El Fejja→Oued Zarga
-- Cumuls A1 Sud (quasi-exact)
update public.toll_rates set amount = 7.100, updated_at = now() where country='TN' and city_a='Tunis'  and city_b='Sfax';     -- 3.900 (→M'saken) + 3.200 (→Agareb)
update public.toll_rates set amount = 3.700, updated_at = now() where country='TN' and city_a='Sousse' and city_b='Sfax';     -- 0.500 (→M'saken) + 3.200 (→Agareb)

-- Nouveaux axes officiels (A3 Béja, A1 Sud Gabès) — idempotent
insert into public.toll_rates (country, city_a, city_b, point_a, point_b, amount)
select 'TN','Tunis','Béja', st_point(10.1815,36.8065)::geography, st_point(9.1817,36.7256)::geography, 2.700
where not exists (select 1 from public.toll_rates where country='TN' and city_a='Tunis' and city_b='Béja');

insert into public.toll_rates (country, city_a, city_b, point_a, point_b, amount)
select 'TN','Tunis','Gabès', st_point(10.1815,36.8065)::geography, st_point(10.0982,33.8815)::geography, 10.700
where not exists (select 1 from public.toll_rates where country='TN' and city_a='Tunis' and city_b='Gabès');
