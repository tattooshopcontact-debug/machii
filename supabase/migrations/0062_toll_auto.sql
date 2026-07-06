-- Machii — Calcul AUTOMATIQUE du péage (le trou signalé : il valait 0 par défaut).
-- Table des péages par axe (géolocalisée) + intégration dans compute_trip_cost.
-- Multi-pays : chaque pays a ses lignes. ⚠️ Montants TN = valeurs de départ (classe 1, à confirmer sur le barème officiel Tunisie Autoroutes).

-- 1) Table des péages par axe (points de départ/arrivée géolocalisés)
create table if not exists public.toll_rates (
  id         bigint generated always as identity primary key,
  country    text not null,
  city_a     text not null,
  city_b     text not null,
  point_a    geography(Point,4326) not null,
  point_b    geography(Point,4326) not null,
  amount     numeric(6,3) not null,          -- DT, véhicule léger (classe 1)
  updated_at timestamptz not null default now()
);
create index if not exists toll_rates_country_idx on public.toll_rates (country);
create index if not exists toll_rates_a_gix on public.toll_rates using gist (point_a);
create index if not exists toll_rates_b_gix on public.toll_rates using gist (point_b);

-- 2) Seed axes TN à péage (A1 / A3 / A4). st_point(lng, lat).
insert into public.toll_rates (country, city_a, city_b, point_a, point_b, amount) values
  ('TN','Tunis','Sousse',      st_point(10.1815,36.8065)::geography, st_point(10.6369,35.8256)::geography,  7.000),
  ('TN','Tunis','Sfax',        st_point(10.1815,36.8065)::geography, st_point(10.7603,34.7398)::geography, 15.500),
  ('TN','Tunis','Msaken',      st_point(10.1815,36.8065)::geography, st_point(10.5797,35.7297)::geography, 13.000),
  ('TN','Tunis','Hammamet',    st_point(10.1815,36.8065)::geography, st_point(10.6167,36.4000)::geography,  4.000),
  ('TN','Tunis','Enfidha',     st_point(10.1815,36.8065)::geography, st_point(10.3803,36.1350)::geography,  5.500),
  ('TN','Tunis','Bizerte',     st_point(10.1815,36.8065)::geography, st_point( 9.8642,37.2744)::geography,  2.500),
  ('TN','Tunis','Oued Zarga',  st_point(10.1815,36.8065)::geography, st_point( 9.4192,36.6725)::geography,  2.000),
  ('TN','Sousse','Sfax',       st_point(10.6369,35.8256)::geography, st_point(10.7603,34.7398)::geography,  8.500)
on conflict do nothing;

alter table public.toll_rates enable row level security;
drop policy if exists toll_rates_read on public.toll_rates;
create policy toll_rates_read on public.toll_rates for select using (true);
grant select on public.toll_rates to authenticated, anon;

-- 3) compute_trip_cost : péage cherché AUTOMATIQUEMENT (origine≈A & dest≈B, ou l'inverse, ≤ 20 km).
--    p_toll reste un override manuel optionnel (si > 0, il prime).
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

  -- PÉAGE automatique : axe dont A/B encadrent le trajet (≤ 20 km), sinon 0
  select tr.amount into v_toll
    from public.toll_rates tr
   where tr.country = v_trip.country
     and (
       (st_dwithin(v_trip.origin, tr.point_a, 20000) and st_dwithin(v_trip.destination, tr.point_b, 20000)) or
       (st_dwithin(v_trip.origin, tr.point_b, 20000) and st_dwithin(v_trip.destination, tr.point_a, 20000))
     )
   order by tr.amount desc
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
    'detail', jsonb_build_object(
      'carburant', round(v_carbu,3),
      'usure',     round(v_usure,3),
      'peage',     v_toll)
  );
end $$;

grant execute on function public.compute_trip_cost(uuid,int,numeric) to authenticated, anon;
