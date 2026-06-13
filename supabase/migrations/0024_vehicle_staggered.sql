-- ============================================================================
-- Machii — #12-A : véhicule conducteur + affichage échelonné (option F7)
--
-- Le conducteur enregistre SON véhicule (marque/modèle/couleur/plaque). Sur la
-- fiche d'un trajet :
--   • AVANT acceptation : infos génériques (marque · modèle · couleur) — PAS la
--     plaque ni la photo (anti-usurpation, cf décision #12-A).
--   • APRÈS acceptation (ou si on est le conducteur) : plaque + photo révélées.
--
-- La règle de révélation est appliquée CÔTÉ SERVEUR par la RPC get_trip_vehicle
-- (SECURITY DEFINER), pour qu'un passager non accepté ne puisse jamais lire la
-- plaque, même en tapant la table directement.
--
-- Idempotent.
-- ============================================================================

-- 1) Un véhicule "principal" par conducteur (upsert par driver_id).
--    (La table autorisait plusieurs lignes ; on contraint à une par conducteur.)
delete from public.vehicles v
using public.vehicles v2
where v.driver_id = v2.driver_id and v.ctid < v2.ctid; -- garde la plus récente
create unique index if not exists vehicles_driver_uidx on public.vehicles (driver_id);

-- 2) RLS : le conducteur gère SON véhicule. La lecture par les passagers passe
--    uniquement par la RPC (definer), donc pas de policy select publique.
alter table public.vehicles enable row level security;

drop policy if exists "vehicles owner all" on public.vehicles;
create policy "vehicles owner all" on public.vehicles for all
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());

grant select, insert, update, delete on public.vehicles to authenticated;

-- 3) RPC : véhicule d'un trajet avec révélation échelonnée.
create or replace function public.get_trip_vehicle(p_trip_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_trip    public.trips%rowtype;
  v_veh     public.vehicles%rowtype;
  v_reveal  boolean := false;
begin
  select * into v_trip from public.trips where id = p_trip_id;
  if v_trip.id is null or v_trip.vehicle_id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_vehicle');
  end if;

  select * into v_veh from public.vehicles where id = v_trip.vehicle_id;
  if v_veh.id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_vehicle');
  end if;

  -- Révélation si on est le conducteur OU si on a une réservation acceptée/terminée.
  if auth.uid() is not null and (
       v_trip.driver_id = auth.uid()
       or exists (
         select 1 from public.bookings b
         where b.trip_id = p_trip_id
           and b.passenger_id = auth.uid()
           and b.status in ('accepted', 'completed')
       )
     ) then
    v_reveal := true;
  end if;

  return jsonb_build_object(
    'ok', true,
    'make', v_veh.make,
    'model', v_veh.model,
    'color', v_veh.color,
    'seats', v_veh.seats,
    'revealed', v_reveal,
    'plate', case when v_reveal then v_veh.plate else null end,
    'photo_url', case when v_reveal then v_veh.photo_url else null end
  );
end;
$$;
grant execute on function public.get_trip_vehicle(uuid) to authenticated;

-- 4) Registre feature flag : F7, OFF par défaut (publication progressive).
insert into public.feature_flags (key, num, label, version, enabled) values
  ('vehicle_info', 7, 'Véhicule + affichage échelonné (plaque après acceptation)', 'v1.2.0', false)
on conflict (key) do update
  set num = excluded.num, label = excluded.label, version = excluded.version;
