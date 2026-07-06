-- Machii — Fix péage : choisir l'axe dont les EXTRÉMITÉS sont les plus proches du trajet
-- (avant : order by amount desc → Tunis→Sousse prenait Tunis→Msaken 13 DT au lieu de 7 DT car Msaken < 20 km de Sousse).
-- Correctif : order by distance totale des extrémités (le meilleur appariement géographique gagne).

create or replace function public.compute_trip_cost(
  p_trip_id   uuid,
  p_occupants int     default null,
  p_toll      numeric default 0
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_trip    public.trips%rowtype;
  v_veh     public.vehicles%rowtype;
  v_conso   numeric;
  v_price   numeric;
  v_wear    numeric;
  v_dist_km numeric;
  v_occ     int;
  v_toll    numeric;
  v_carbu   numeric;
  v_usure   numeric;
  v_total   numeric;
  v_part    numeric;
begin
  select * into v_trip from public.trips where id = p_trip_id;
  if v_trip.id is null then
    return jsonb_build_object('ok', false, 'reason', 'trip_not_found');
  end if;

  v_dist_km := coalesce(st_length(v_trip.route), st_distance(v_trip.origin, v_trip.destination)) / 1000.0;

  select * into v_veh from public.vehicles where id = v_trip.vehicle_id;
  v_conso := coalesce(
    v_veh.consumption_l100,
    public.get_vehicle_consumption(v_veh.make, v_veh.model, v_veh.year, v_veh.fuel_type),
    7.0);

  select price_per_liter into v_price
    from public.fuel_prices
   where country = v_trip.country and fuel_type = coalesce(v_veh.fuel_type,'essence');
  v_price := coalesce(v_price, 2.5);

  select wear_per_km into v_wear from public.cost_params where country = v_trip.country;
  v_wear := coalesce(v_wear, 0.05);

  -- PÉAGE : axe à péage dont les extrémités encadrent le mieux le trajet (≤ 20 km), le PLUS PROCHE gagne
  select tr.amount into v_toll
    from public.toll_rates tr
   where tr.country = v_trip.country
     and (
       (st_dwithin(v_trip.origin, tr.point_a, 20000) and st_dwithin(v_trip.destination, tr.point_b, 20000)) or
       (st_dwithin(v_trip.origin, tr.point_b, 20000) and st_dwithin(v_trip.destination, tr.point_a, 20000))
     )
   order by least(
     st_distance(v_trip.origin, tr.point_a) + st_distance(v_trip.destination, tr.point_b),
     st_distance(v_trip.origin, tr.point_b) + st_distance(v_trip.destination, tr.point_a)
   ) asc
   limit 1;
  v_toll := case when coalesce(p_toll,0) > 0 then p_toll else coalesce(v_toll, 0) end;

  v_occ := coalesce(p_occupants, v_trip.seats_total + 1);
  if v_occ < 1 then v_occ := 1; end if;

  v_carbu := v_dist_km * v_conso / 100.0 * v_price;
  v_usure := v_dist_km * v_wear;
  v_total := round((v_carbu + v_usure + v_toll)::numeric, 3);
  v_part  := round((v_total / v_occ)::numeric, 3);

  return jsonb_build_object(
    'ok', true,
    'distance_km', round(v_dist_km,1),
    'consommation_l100', v_conso,
    'prix_carburant', v_price,
    'usure_par_km', v_wear,
    'occupants', v_occ,
    'cout_total', v_total,
    'part_par_personne', v_part,
    'detail', jsonb_build_object('carburant', round(v_carbu,3), 'usure', round(v_usure,3), 'peage', v_toll)
  );
end $$;

grant execute on function public.compute_trip_cost(uuid,int,numeric) to authenticated, anon;
