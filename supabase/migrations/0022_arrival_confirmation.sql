-- ============================================================================
-- Machii — #11-C (partie 1) : confirmation d'arrivée symétrique
--
-- Une fois le passager pris en charge (#12-B, picked_up_at), le PASSAGER OU le
-- CONDUCTEUR peut confirmer l'arrivée. Cela horodate `arrived_at` et passe la
-- réservation en 'completed'. La confirmation du passager est le signal "je suis
-- bien arrivé(e)" qui désamorcera l'alerte fallback (partie 2, à venir).
--
-- Idempotent.
-- ============================================================================

alter table public.bookings add column if not exists arrived_at timestamptz;

create or replace function public.confirm_arrival(p_booking_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings%rowtype;
  v_trip    public.trips%rowtype;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if v_booking.id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  select * into v_trip from public.trips where id = v_booking.trip_id;

  -- L'appelant doit être un PARTICIPANT du trajet (passager OU conducteur).
  -- `is distinct from` rejette aussi le cas auth.uid() NULL.
  if auth.uid() is null
     or (auth.uid() is distinct from v_booking.passenger_id
         and auth.uid() is distinct from v_trip.driver_id) then
    return jsonb_build_object('ok', false, 'reason', 'not_participant');
  end if;

  if v_booking.status <> 'accepted' then
    return jsonb_build_object('ok', false, 'reason', 'not_accepted');
  end if;

  if v_booking.picked_up_at is null then
    return jsonb_build_object('ok', false, 'reason', 'not_picked_up');
  end if;

  if v_booking.arrived_at is not null then
    return jsonb_build_object('ok', true, 'reason', 'already');
  end if;

  update public.bookings
    set arrived_at = now(), status = 'completed'
    where id = p_booking_id;

  return jsonb_build_object('ok', true);
end;
$$;
grant execute on function public.confirm_arrival(uuid) to authenticated;
