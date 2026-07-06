-- Machii — Logique carburant INTELLIGENTE (demande Faouez).
-- Renvoie les carburants réellement disponibles pour une voiture (depuis la base conso).
-- Ex : Peugeot 203 → {essence} (jamais électrique) ; Renault Clio → {essence,gasoil} ; Toyota Yaris → {essence,hybride}.
-- L'app n'affiche que ces carburants. Vide (modèle inconnu) → fallback app : essence/gasoil/gpl.
create or replace function public.get_vehicle_fuel_types(
  p_make text, p_model text, p_year int default null
) returns text[] language sql stable as $$
  select coalesce(array_agg(distinct fuel_type), array[]::text[])
  from public.vehicle_consumption
  where lower(make) = lower(p_make)
    and lower(model) = lower(p_model)
    and (p_year is null or (
          (year_from is null or p_year >= year_from) and
          (year_to   is null or p_year <= year_to)));
$$;

grant execute on function public.get_vehicle_fuel_types(text,text,int) to authenticated, anon;
