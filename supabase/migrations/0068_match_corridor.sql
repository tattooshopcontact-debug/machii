-- Machii — Matching LE LONG DU TRAJET (corridor).
-- Trouve les trajets dont le TRACÉ (route LineString) passe près du départ ET de l'arrivée du passager,
--   dans le BON SENS (montée avant descente), dans la tolérance de détour du conducteur.
-- Ex : conducteur Manouba→Tunis centre ; passager Bardo→Bab Saâdoun → match (les 2 sont sur le chemin).

-- 1) Tolérance de détour dans le profil conducteur (km). null = défaut pays (cost_params).
alter table public.profiles
  add column if not exists detour_tolerance_km numeric;   -- 0 = circuit strict ; null = défaut pays

-- 2) RPC de matching corridor
create or replace function public.match_corridor(
  p_origin_lng float, p_origin_lat float,
  p_dest_lng   float, p_dest_lat   float,
  p_country    text default 'TN'
)
returns setof public.trips
language plpgsql stable as $$
declare
  v_o      geography := st_point(p_origin_lng, p_origin_lat)::geography;
  v_d      geography := st_point(p_dest_lng,   p_dest_lat)::geography;
  v_def_km numeric;
begin
  select coalesce(default_detour_tolerance_km, 3) into v_def_km
    from public.cost_params where country = p_country;
  v_def_km := coalesce(v_def_km, 3);

  return query
  select t.*
  from public.trips t
  join public.profiles pr on pr.id = t.driver_id
  where t.country = p_country
    and t.status = 'open'
    and t.seats_available > 0
    and t.route is not null
    -- départ ET arrivée du passager à ≤ tolérance du conducteur (en mètres) du tracé
    and st_dwithin(t.route, v_o, (coalesce(pr.detour_tolerance_km, v_def_km) * 1000)::float8)
    and st_dwithin(t.route, v_d, (coalesce(pr.detour_tolerance_km, v_def_km) * 1000)::float8)
    -- BON SENS : la montée est avant la descente le long du tracé
    and st_linelocatepoint(t.route::geometry, v_o::geometry)
      < st_linelocatepoint(t.route::geometry, v_d::geometry)
  order by (st_distance(t.route, v_o) + st_distance(t.route, v_d)) asc,  -- les plus "sur la route" d'abord
           t.departure_time asc;
end $$;

grant execute on function public.match_corridor(float,float,float,float,text) to anon, authenticated;
