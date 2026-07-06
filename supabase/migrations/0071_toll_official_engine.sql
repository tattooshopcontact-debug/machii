-- Machii — Moteur de péage basé sur la GRILLE OFFICIELLE aspirée (toll_stations + toll_matrix).
-- official_toll(origine, destination) : station la + proche du départ et de l'arrivée (≤ 30 km),
--   puis tarif exact via la matrice officielle. Traverse A1 Nord↔Sud via la charnière (Hergla 28 / Msaken 13).
-- Remplace l'ancienne détection par paires de villes (toll_rates) dans compute_trip_cost.

create or replace function public.official_toll(p_o geography, p_d geography)
returns numeric language plpgsql stable as $$
declare sf record; st record; v numeric; v1 numeric; v2 numeric;
begin
  select id, highway_id, st_distance(geom, p_o) dist into sf
    from public.toll_stations where geom is not null order by geom <-> p_o limit 1;
  select id, highway_id, st_distance(geom, p_d) dist into st
    from public.toll_stations where geom is not null order by geom <-> p_d limit 1;
  if sf.id is null or st.id is null then return 0; end if;
  if sf.dist > 30000 or st.dist > 30000 then return 0; end if;   -- trajet pas près d'une autoroute à péage
  if sf.id = st.id then return 0; end if;
  if sf.highway_id = st.highway_id then
    select price into v from public.toll_matrix where from_id=sf.id and to_id=st.id and klass='c1';
    return coalesce(v,0);
  end if;
  -- A1 : Nord (hw1, charnière Hergla=28) ↔ Sud (hw2, charnière Msaken=13)
  if sf.highway_id=1 and st.highway_id=2 then
    select price into v1 from public.toll_matrix where from_id=sf.id and to_id=28 and klass='c1';
    select price into v2 from public.toll_matrix where from_id=13 and to_id=st.id and klass='c1';
    return coalesce(v1,0)+coalesce(v2,0);
  elsif sf.highway_id=2 and st.highway_id=1 then
    select price into v1 from public.toll_matrix where from_id=sf.id and to_id=13 and klass='c1';
    select price into v2 from public.toll_matrix where from_id=28 and to_id=st.id and klass='c1';
    return coalesce(v1,0)+coalesce(v2,0);
  end if;
  return 0;  -- autres combinaisons (A3/A4 non reliées par péage) → 0, confirmable par le conducteur
end $$;

create or replace function public.compute_trip_cost(
  p_trip_id uuid, p_occupants int default null, p_toll numeric default 0
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_trip public.trips%rowtype; v_veh public.vehicles%rowtype;
  v_conso numeric; v_price numeric; v_wear numeric; v_margin numeric;
  v_dist_km numeric; v_occ int; v_toll numeric;
  v_carbu numeric; v_usure numeric; v_total numeric; v_part_reel numeric; v_part_max numeric;
begin
  select * into v_trip from public.trips where id = p_trip_id;
  if v_trip.id is null then return jsonb_build_object('ok',false,'reason','trip_not_found'); end if;

  v_dist_km := coalesce(st_length(v_trip.route), st_distance(v_trip.origin, v_trip.destination)) / 1000.0;

  select * into v_veh from public.vehicles where id = v_trip.vehicle_id;
  v_conso := coalesce(v_veh.consumption_l100,
             public.get_vehicle_consumption(v_veh.make, v_veh.model, v_veh.year, v_veh.fuel_type), 7.0);

  select price_per_liter into v_price from public.fuel_prices
    where country = v_trip.country and fuel_type = coalesce(v_veh.fuel_type,'essence');
  v_price := coalesce(v_price, 2.5);

  select wear_per_km, margin_pct into v_wear, v_margin from public.cost_params where country = v_trip.country;
  v_wear := coalesce(v_wear,0.05); v_margin := coalesce(v_margin,0.40);

  -- PÉAGE officiel (grille aspirée) ; p_toll > 0 = override manuel (confirmation conducteur)
  v_toll := case when coalesce(p_toll,0) > 0 then p_toll
                 else public.official_toll(v_trip.origin, v_trip.destination) end;

  v_occ := coalesce(p_occupants, v_trip.seats_total + 1); if v_occ < 1 then v_occ := 1; end if;
  v_carbu := v_dist_km * v_conso / 100.0 * v_price;
  v_usure := v_dist_km * v_wear;
  v_total := round((v_carbu + v_usure + v_toll)::numeric, 3);
  v_part_reel := round((v_total / v_occ)::numeric, 3);
  v_part_max  := round((v_part_reel * (1 + v_margin))::numeric, 3);

  return jsonb_build_object('ok',true,'distance_km',round(v_dist_km,1),
    'consommation_l100',v_conso,'prix_carburant',v_price,'usure_par_km',v_wear,'peage',v_toll,
    'occupants',v_occ,'cout_total',v_total,'marge_pct',v_margin,
    'part_reelle',v_part_reel,'fourchette_min',0,'fourchette_max',v_part_max,
    'detail',jsonb_build_object('carburant',round(v_carbu,3),'usure',round(v_usure,3),'peage',v_toll));
end $$;

grant execute on function public.official_toll(geography,geography) to authenticated, anon;
grant execute on function public.compute_trip_cost(uuid,int,numeric) to authenticated, anon;
