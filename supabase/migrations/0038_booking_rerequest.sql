-- ============================================================================
-- Machii — Re-demande de réservation après refus/annulation.
--
-- Problème (audit 2026-07-02) : la contrainte UNIQUE (trip_id, passenger_id) +
-- la policy "bookings passenger cancel" (0033, WITH CHECK status='cancelled')
-- empêchaient un passager dont la demande a été REFUSÉE (rejected) ou qui a
-- ANNULÉ (cancelled) de re-demander le trajet : ré-INSERT bloqué (23505) et
-- UPDATE→pending interdit. Le passager restait bloqué à vie.
--
-- Solution : RPC `request_booking(trip_id)` SECURITY DEFINER qui gère les deux
-- cas de façon atomique et sûre :
--   - pas de réservation existante → INSERT pending ;
--   - réservation 'cancelled'/'rejected' → réactivée en 'pending' ;
--   - réservation 'pending'/'accepted'/'completed' → refus (already_active).
-- Contrôles serveur : trajet ouvert, places dispo, pas son propre trajet.
--
-- Idempotent.
-- ============================================================================

create or replace function public.request_booking(p_trip_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_trip public.trips%rowtype;
  v_existing public.bookings%rowtype;
begin
  if v_uid is null then
    return json_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  select * into v_trip from public.trips where id = p_trip_id;
  if v_trip.id is null then
    return json_build_object('ok', false, 'reason', 'trip_not_found');
  end if;
  if v_trip.driver_id = v_uid then
    return json_build_object('ok', false, 'reason', 'own_trip');
  end if;
  if v_trip.status <> 'open' or coalesce(v_trip.seats_available, 0) < 1 then
    return json_build_object('ok', false, 'reason', 'trip_unavailable');
  end if;

  select * into v_existing
  from public.bookings
  where trip_id = p_trip_id and passenger_id = v_uid;

  if v_existing.id is not null then
    if v_existing.status in ('cancelled', 'rejected') then
      update public.bookings
         set status = 'pending', seats_booked = 1
       where id = v_existing.id;
      return json_build_object('ok', true, 'reactivated', true);
    else
      return json_build_object('ok', false, 'reason', 'already_active');
    end if;
  end if;

  insert into public.bookings (trip_id, passenger_id, seats_booked, status)
  values (p_trip_id, v_uid, 1, 'pending');

  return json_build_object('ok', true, 'reactivated', false);
end;
$$;

revoke all on function public.request_booking(uuid) from public, anon;
grant execute on function public.request_booking(uuid) to authenticated;
