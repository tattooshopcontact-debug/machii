-- Machii — Ajout des axes du SUD manquants (question Faouez : Sousse→Gabès ?).
-- Calculés depuis la grille officielle Tunisie Autoroutes (A1 Nord + A1 Sud, charnière M'saken, classe 1).
-- Points : Sousse(10.6369,35.8256) Msaken(10.5797,35.7297) Sfax(10.7603,34.7398) Gabès(10.0982,33.8815)

insert into public.toll_rates (country, city_a, city_b, point_a, point_b, amount)
select 'TN','Sousse','Gabès', st_point(10.6369,35.8256)::geography, st_point(10.0982,33.8815)::geography, 7.300  -- 0.5 + 6.8
where not exists (select 1 from public.toll_rates where country='TN' and city_a='Sousse' and city_b='Gabès');

insert into public.toll_rates (country, city_a, city_b, point_a, point_b, amount)
select 'TN','Msaken','Gabès', st_point(10.5797,35.7297)::geography, st_point(10.0982,33.8815)::geography, 6.800
where not exists (select 1 from public.toll_rates where country='TN' and city_a='Msaken' and city_b='Gabès');

insert into public.toll_rates (country, city_a, city_b, point_a, point_b, amount)
select 'TN','Msaken','Sfax', st_point(10.5797,35.7297)::geography, st_point(10.7603,34.7398)::geography, 3.200
where not exists (select 1 from public.toll_rates where country='TN' and city_a='Msaken' and city_b='Sfax');

insert into public.toll_rates (country, city_a, city_b, point_a, point_b, amount)
select 'TN','Sfax','Gabès', st_point(10.7603,34.7398)::geography, st_point(10.0982,33.8815)::geography, 3.600  -- ~ Agareb→Gabès
where not exists (select 1 from public.toll_rates where country='TN' and city_a='Sfax' and city_b='Gabès');
