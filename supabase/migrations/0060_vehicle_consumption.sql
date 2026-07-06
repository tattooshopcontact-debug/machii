-- Machii — Moteur de consommation MULTI-PAYS (Chemin A : base mondiale + fallback + lookup).
-- Le conducteur ne saisit JAMAIS sa conso : il choisit sa voiture, le système la connaît.
-- Détail complet : RECHERCHE_CALCUL_CONSO_2026-07-06.md

-- 1) Base mondiale de consommation (remplie par le bot depuis EEA / CarDatabaseApi ; valeurs corrigées "monde réel")
create table if not exists public.vehicle_consumption (
  id               bigint generated always as identity primary key,
  make             text not null,
  model            text not null,
  year_from        int,
  year_to          int,
  fuel_type        text not null check (fuel_type in ('essence','gasoil','gpl','hybride','electrique')),
  consumption_l100 numeric(4,1) not null,
  source           text,                        -- 'EEA' | 'CarDatabaseApi' | 'Spritmonitor'...
  created_at       timestamptz not null default now()
);
create index if not exists vehicle_consumption_lookup_idx
  on public.vehicle_consumption (lower(make), lower(model), fuel_type);

-- 2) Défauts par carburant (dernier recours si le modèle est absent de la base)
create table if not exists public.consumption_defaults (
  fuel_type        text primary key check (fuel_type in ('essence','gasoil','gpl','hybride','electrique')),
  consumption_l100 numeric(4,1) not null
);
insert into public.consumption_defaults (fuel_type, consumption_l100) values
  ('essence', 7.5), ('gasoil', 6.0), ('gpl', 9.5), ('hybride', 4.5), ('electrique', 0)
on conflict (fuel_type) do nothing;

-- 3) Lookup : renvoie TOUJOURS une conso (modèle exact → défaut carburant → 7.0)
create or replace function public.get_vehicle_consumption(
  p_make text, p_model text, p_year int, p_fuel text
) returns numeric
language sql stable as $$
  select coalesce(
    (select vc.consumption_l100
       from public.vehicle_consumption vc
      where lower(vc.make)  = lower(p_make)
        and lower(vc.model) = lower(p_model)
        and vc.fuel_type    = p_fuel
        and (p_year is null or (
              (vc.year_from is null or p_year >= vc.year_from) and
              (vc.year_to   is null or p_year <= vc.year_to)))
      order by vc.year_from desc nulls last
      limit 1),
    (select cd.consumption_l100 from public.consumption_defaults cd where cd.fuel_type = p_fuel),
    7.0
  );
$$;

-- 4) RLS : lecture publique (données non sensibles), écriture réservée service_role/admin
alter table public.vehicle_consumption enable row level security;
alter table public.consumption_defaults enable row level security;
drop policy if exists vc_read on public.vehicle_consumption;
drop policy if exists cd_read on public.consumption_defaults;
create policy vc_read on public.vehicle_consumption for select using (true);
create policy cd_read on public.consumption_defaults for select using (true);
grant select on public.vehicle_consumption, public.consumption_defaults to authenticated, anon;
grant execute on function public.get_vehicle_consumption(text,text,int,text) to authenticated, anon;
