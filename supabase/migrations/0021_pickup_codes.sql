-- ============================================================================
-- Machii — #12-B : codes de prise en charge à 4 chiffres
--
-- Quand le conducteur ACCEPTE une réservation, un code à 4 chiffres est généré
-- automatiquement. Le PASSAGER voit ce code ; à la montée, il le donne au
-- conducteur qui le saisit dans l'app (RPC confirm_pickup) pour confirmer la
-- prise en charge. C'est la brique de base du futur dispositif no-show (#13)
-- et de la confirmation d'arrivée (#11-C).
--
-- Idempotent.
-- ============================================================================

-- 1) Horodatage de la prise en charge effective.
alter table public.bookings add column if not exists picked_up_at timestamptz;

-- 2) Génère le code 4 chiffres à la bascule vers 'accepted' (s'il n'existe pas).
create or replace function public._gen_pickup_code()
returns trigger language plpgsql as $$
begin
  if new.status = 'accepted'
     and (tg_op = 'INSERT' or old.status is distinct from 'accepted')
     and (new.confirm_code is null or new.confirm_code = '') then
    new.confirm_code := lpad((floor(random() * 10000))::int::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_gen_pickup_code on public.bookings;
create trigger trg_gen_pickup_code
  before insert or update on public.bookings
  for each row execute function public._gen_pickup_code();

-- 3) Backfill : code pour les réservations déjà acceptées sans code.
update public.bookings
set confirm_code = lpad((floor(random() * 10000))::int::text, 4, '0')
where status = 'accepted' and (confirm_code is null or confirm_code = '');

-- 4) RPC : le CONDUCTEUR du trajet saisit le code du passager pour confirmer
--    la prise en charge. SECURITY DEFINER + vérif explicite du conducteur.
create or replace function public.confirm_pickup(p_booking_id uuid, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings%rowtype;
  v_trip    public.trips%rowtype;
  v_code    text := regexp_replace(coalesce(p_code, ''), '\D', '', 'g');
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if v_booking.id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Garde-fou : `is distinct from` rejette aussi le cas auth.uid() NULL (anon),
  -- alors que `<> ` renverrait NULL et laisserait passer la vérification.
  select * into v_trip from public.trips where id = v_booking.trip_id;
  if auth.uid() is null or v_trip.driver_id is null
     or v_trip.driver_id is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'not_driver');
  end if;

  if v_booking.status <> 'accepted' then
    return jsonb_build_object('ok', false, 'reason', 'not_accepted');
  end if;

  if v_booking.picked_up_at is not null then
    return jsonb_build_object('ok', true, 'reason', 'already');
  end if;

  if v_booking.confirm_code is null or v_code <> v_booking.confirm_code then
    return jsonb_build_object('ok', false, 'reason', 'bad_code');
  end if;

  update public.bookings set picked_up_at = now() where id = p_booking_id;
  return jsonb_build_object('ok', true);
end;
$$;
grant execute on function public.confirm_pickup(uuid, text) to authenticated;
