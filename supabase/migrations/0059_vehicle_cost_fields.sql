-- Machii — Phase 0 du système « participation intelligente ».
-- Ajoute au véhicule les champs nécessaires au CALCUL DU COÛT RÉEL (année, carburant, conso),
-- + 2 tables de config : prix carburant officiels (DT/L) et paramètres de coût (usure/km, tolérance détour).
-- Additif et idempotent. Aucune donnée existante touchée. ADN partage : zéro tarif imposé, on calcule un plafond.

-- 1) Champs coût sur le véhicule ------------------------------------------------
alter table public.vehicles
  add column if not exists year             int,
  add column if not exists fuel_type        text,
  add column if not exists consumption_l100 numeric(4,1);   -- litres / 100 km

-- garde-fou : type de carburant connu
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'vehicles_fuel_type_chk') then
    alter table public.vehicles
      add constraint vehicles_fuel_type_chk
      check (fuel_type is null or fuel_type in ('essence','gasoil','gpl','hybride','electrique'));
  end if;
end $$;

-- 2) Prix carburant officiels (par pays + type) --------------------------------
--    ⚠️ VALEURS DE DÉPART À CONFIRMER par Faouez (prix officiels TN actuels).
create table if not exists public.fuel_prices (
  country         text not null,
  fuel_type       text not null,
  price_per_liter numeric(6,3) not null,           -- DT / litre
  updated_at      timestamptz not null default now(),
  primary key (country, fuel_type)
);

insert into public.fuel_prices (country, fuel_type, price_per_liter) values
  ('TN','essence', 2.525),
  ('TN','gasoil',  2.205),
  ('TN','gpl',     1.500)
on conflict (country, fuel_type) do nothing;

-- 3) Paramètres de coût (usure + tolérance détour par défaut) -------------------
--    ⚠️ VALEURS DE DÉPART À CONFIRMER. Usure = pneus + entretien + dépréciation (coûts cachés).
--    Volontairement CONSERVATEUR (participation modeste = reste clairement du partage, pas du profit).
create table if not exists public.cost_params (
  country                     text primary key,
  wear_per_km                 numeric(6,3) not null default 0.050,  -- DT / km
  default_detour_tolerance_km numeric      not null default 3,      -- km
  updated_at                  timestamptz  not null default now()
);

insert into public.cost_params (country, wear_per_km, default_detour_tolerance_km) values
  ('TN', 0.050, 3)
on conflict (country) do nothing;

-- 4) RLS : config lisible par tous, écriture réservée (service_role / admin) ----
alter table public.fuel_prices enable row level security;
alter table public.cost_params enable row level security;

drop policy if exists fuel_prices_read on public.fuel_prices;
drop policy if exists cost_params_read on public.cost_params;
create policy fuel_prices_read on public.fuel_prices for select using (true);
create policy cost_params_read on public.cost_params for select using (true);

grant select on public.fuel_prices to authenticated, anon;
grant select on public.cost_params to authenticated, anon;
