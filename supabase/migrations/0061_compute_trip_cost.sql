-- Machii — Calcul du COÛT RÉEL d'un trajet + partage par occupants (conducteur inclus).
-- Coût = distance × (conso × prix_carburant/100 + usure/km) + péage ; ÷ occupants ; = plafond légal.
-- SECURITY DEFINER : un passager (non-propriétaire du véhicule) doit pouvoir obtenir le coût,
--   MAIS on ne renvoie que des chiffres dérivés — jamais la plaque ni la photo (anti-fuite).
-- Détail : RECHERCHE_CALCUL_CONSO_2026-07-06.md — participation plafonnée (bouclier loi 2004-33).

create or replace function public.compute_trip_cost(
  p_trip_id   uuid,
  p_occupants int     default null,   -- total personnes (conducteur inclus) ; défaut = voiture pleine
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
  v_carbu   numeric;
  v_usure   numeric;
  v_total   numeric;
  v_part    numeric;
begin
  select * into v_trip from public.trips where id = p_trip_id;
  if v_trip.id is null then
    return jsonb_build_object('ok', false, 'reason', 'trip_not_found');
  end if;

  -- distance (mètres → km) : le tracé si présent, sinon distance à vol d'oiseau
  v_dist_km := coalesce(st_length(v_trip.route), st_distance(v_trip.origin, v_trip.destination)) / 1000.0;

  -- véhicule + consommation (jamais NULL grâce au lookup + défauts)
  select * into v_veh from public.vehicles where id = v_trip.vehicle_id;
  v_conso := coalesce(
    v_veh.consumption_l100,
    public.get_vehicle_consumption(v_veh.make, v_veh.model, v_veh.year, v_veh.fuel_type),
    7.0
  );

  -- prix carburant du PAYS du trajet (multi-pays) + usure/km du pays
  select price_per_liter into v_price
    from public.fuel_prices
   where country = v_trip.country and fuel_type = coalesce(v_veh.fuel_type, 'essence');
  v_price := coalesce(v_price, 2.5);

  select wear_per_km into v_wear from public.cost_params where country = v_trip.country;
  v_wear := coalesce(v_wear, 0.05);

  -- occupants : défaut = voiture pleine (places passagers + conducteur)
  v_occ := coalesce(p_occupants, v_trip.seats_total + 1);
  if v_occ < 1 then v_occ := 1; end if;

  v_carbu := v_dist_km * v_conso / 100.0 * v_price;
  v_usure := v_dist_km * v_wear;
  v_total := round((v_carbu + v_usure + coalesce(p_toll, 0))::numeric, 3);
  v_part  := round((v_total / v_occ)::numeric, 3);

  return jsonb_build_object(
    'ok', true,
    'distance_km',       round(v_dist_km, 1),
    'consommation_l100', v_conso,
    'prix_carburant',    v_price,
    'usure_par_km',      v_wear,
    'occupants',         v_occ,
    'cout_total',        v_total,
    'part_par_personne', v_part,   -- montant SUGGÉRÉ = PLAFOND (le conducteur ne peut pas dépasser)
    'detail', jsonb_build_object(
      'carburant', round(v_carbu, 3),
      'usure',     round(v_usure, 3),
      'peage',     coalesce(p_toll, 0)
    )
  );
end $$;

grant execute on function public.compute_trip_cost(uuid, int, numeric) to authenticated, anon;
