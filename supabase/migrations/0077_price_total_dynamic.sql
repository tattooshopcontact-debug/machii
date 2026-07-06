-- Machii — PRIX TOTAL dynamique (modèle Faouez).
-- Le conducteur met UN prix total pour le voyage ; il se divise entre tous les occupants
--   (conducteur + passagers confirmés). Plus il y a de passagers, moins cher pour chacun.
-- Modes : Offert (price_total = 0) · Participation (price_total > 0). Plus de « À convenir ».

-- 1) Colonne prix total (null = pas encore défini ; 0 = Offert ; >0 = Participation)
alter table public.trips add column if not exists price_total int;

-- 2) Prix par personne pour un passager qui rejoint MAINTENANT (ce qu'il verra) :
--    total ÷ (conducteur + passagers déjà confirmés + lui-même)
--    passagers confirmés = seats_total - seats_available
create or replace function public.trip_seat_price(p_trip_id uuid)
returns numeric language sql stable as $$
  select case
    when t.price_total is null or t.price_total <= 0 then coalesce(t.price_total, 0)
    else round(t.price_total::numeric / ((t.seats_total - t.seats_available) + 2), 2)
  end
  from public.trips t where t.id = p_trip_id;
$$;

-- 3) Prix actuel par personne pour ceux DÉJÀ dans la voiture : total ÷ (conducteur + confirmés)
create or replace function public.trip_current_seat_price(p_trip_id uuid)
returns numeric language sql stable as $$
  select case
    when t.price_total is null or t.price_total <= 0 then coalesce(t.price_total, 0)
    else round(t.price_total::numeric / ((t.seats_total - t.seats_available) + 1), 2)
  end
  from public.trips t where t.id = p_trip_id;
$$;

grant execute on function public.trip_seat_price(uuid) to authenticated, anon;
grant execute on function public.trip_current_seat_price(uuid) to authenticated, anon;

-- 4) preview_trip_cost renvoie aussi le TOTAL suggéré + plafond total (le conducteur fixe un total)
create or replace function public.preview_trip_cost(
  p_origin_lng float, p_origin_lat float,
  p_dest_lng   float, p_dest_lat   float,
  p_driver_id  uuid,  p_seats      int,
  p_country    text default 'TN'
) returns jsonb
language plpgsql stable as $$
declare
  v_o geography := st_point(p_origin_lng, p_origin_lat)::geography;
  v_d geography := st_point(p_dest_lng,   p_dest_lat)::geography;
  v_veh public.vehicles%rowtype;
  v_conso numeric; v_price numeric; v_wear numeric; v_margin numeric;
  v_dist_km numeric; v_occ int; v_toll numeric;
  v_carbu numeric; v_usure numeric; v_total numeric; v_part_reel numeric; v_part_max numeric;
begin
  v_dist_km := st_distance(v_o, v_d) / 1000.0 * 1.25;
  select * into v_veh from public.vehicles where driver_id = p_driver_id;
  v_conso := coalesce(v_veh.consumption_l100,
             public.get_vehicle_consumption(v_veh.make, v_veh.model, v_veh.year, v_veh.fuel_type), 7.0);
  select price_per_liter into v_price from public.fuel_prices
    where country = p_country and fuel_type = coalesce(v_veh.fuel_type,'essence');
  v_price := coalesce(v_price, 2.5);
  select wear_per_km, margin_pct into v_wear, v_margin from public.cost_params where country = p_country;
  v_wear := coalesce(v_wear,0.05); v_margin := coalesce(v_margin,0.90);
  v_toll := public.official_toll(v_o, v_d);
  v_occ := coalesce(p_seats,0) + 1;
  if v_occ < 1 then v_occ := 1; end if;
  v_carbu := v_dist_km * v_conso / 100.0 * v_price;
  v_usure := v_dist_km * v_wear;
  v_total := round((v_carbu + v_usure + v_toll)::numeric, 3);
  v_part_reel := round((v_total / v_occ)::numeric, 2);
  v_part_max  := round((v_part_reel * (1 + v_margin))::numeric, 2);

  return jsonb_build_object('ok', true,
    'distance_km', round(v_dist_km,1), 'peage', v_toll, 'occupants', v_occ,
    'cout_total', round(v_total,2), 'part_reelle', v_part_reel,
    'fourchette_min', 0, 'fourchette_max', v_part_max,
    -- pour le mode PRIX TOTAL : suggéré = coût réel total du voyage ; max = total × (1+marge)
    'total_suggested', round(v_total,0),
    'total_max', round(v_total * (1 + v_margin), 0),
    'a_vehicule', v_veh.id is not null, 'consommation_l100', v_conso);
end $$;

grant execute on function public.preview_trip_cost(float,float,float,float,uuid,int,text) to authenticated, anon;
