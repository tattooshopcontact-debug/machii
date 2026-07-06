-- Machii — Marge de sécurité de 25 % sur le coût calculé (demande Faouez).
-- Pourquoi c'est légitime (pas du profit) : la conso RÉELLE dépasse la conso "officielle"
--   d'environ +39 % (ICCT) — vieille voiture, clim, trafic, état moteur, surconsommation.
--   La marge rapproche l'estimation de la vraie dépense → reste du PARTAGE DE FRAIS.
-- La marge devient le MAXIMUM de la fourchette : min = 0 (Offert), max = coût × (1 + marge).

alter table public.cost_params
  add column if not exists margin_pct numeric not null default 0.25;

create or replace function public.compute_trip_cost(
  p_trip_id   uuid,
  p_occupants int     default null,
  p_toll      numeric default 0
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_trip    public.trips%rowtype;
  v_veh     public.vehicles%rowtype;
  v_conso   numeric; v_price numeric; v_wear numeric; v_margin numeric;
  v_dist_km numeric; v_occ int; v_toll numeric;
  v_carbu numeric; v_usure numeric; v_total numeric;
  v_part_reel numeric; v_part_max numeric;
begin
  select * into v_trip from public.trips where id = p_trip_id;
  if v_trip.id is null then
    return jsonb_build_object('ok', false, 'reason', 'trip_not_found');
  end if;

  v_dist_km := coalesce(st_length(v_trip.route), st_distance(v_trip.origin, v_trip.destination)) / 1000.0;

  select * into v_veh from public.vehicles where id = v_trip.vehicle_id;
  v_conso := coalesce(v_veh.consumption_l100,
                      public.get_vehicle_consumption(v_veh.make, v_veh.model, v_veh.year, v_veh.fuel_type), 7.0);

  select price_per_liter into v_price
    from public.fuel_prices where country = v_trip.country and fuel_type = coalesce(v_veh.fuel_type,'essence');
  v_price := coalesce(v_price, 2.5);

  select wear_per_km, margin_pct into v_wear, v_margin from public.cost_params where country = v_trip.country;
  v_wear := coalesce(v_wear, 0.05); v_margin := coalesce(v_margin, 0.25);

  select tr.amount into v_toll
    from public.toll_rates tr
   where tr.country = v_trip.country
     and ((st_dwithin(v_trip.origin, tr.point_a, 20000) and st_dwithin(v_trip.destination, tr.point_b, 20000)) or
          (st_dwithin(v_trip.origin, tr.point_b, 20000) and st_dwithin(v_trip.destination, tr.point_a, 20000)))
   order by least(
     st_distance(v_trip.origin, tr.point_a) + st_distance(v_trip.destination, tr.point_b),
     st_distance(v_trip.origin, tr.point_b) + st_distance(v_trip.destination, tr.point_a)) asc
   limit 1;
  v_toll := case when coalesce(p_toll,0) > 0 then p_toll else coalesce(v_toll, 0) end;

  v_occ := coalesce(p_occupants, v_trip.seats_total + 1);
  if v_occ < 1 then v_occ := 1; end if;

  v_carbu := v_dist_km * v_conso / 100.0 * v_price;
  v_usure := v_dist_km * v_wear;
  v_total := round((v_carbu + v_usure + v_toll)::numeric, 3);
  v_part_reel := round((v_total / v_occ)::numeric, 3);
  v_part_max  := round((v_part_reel * (1 + v_margin))::numeric, 3);   -- MAX de la fourchette (marge incluse)

  return jsonb_build_object(
    'ok', true,
    'distance_km', round(v_dist_km,1),
    'consommation_l100', v_conso,
    'prix_carburant', v_price,
    'usure_par_km', v_wear,
    'peage', v_toll,
    'occupants', v_occ,
    'cout_total', v_total,
    'marge_pct', v_margin,
    'part_reelle', v_part_reel,              -- coût réel estimé / personne
    'fourchette_min', 0,                     -- Offert
    'fourchette_max', v_part_max,            -- coût + marge 25% = plafond que le conducteur ne peut dépasser
    'detail', jsonb_build_object('carburant', round(v_carbu,3), 'usure', round(v_usure,3), 'peage', v_toll)
  );
end $$;

grant execute on function public.compute_trip_cost(uuid,int,numeric) to authenticated, anon;
