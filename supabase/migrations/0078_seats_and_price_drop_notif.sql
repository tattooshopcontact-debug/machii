-- Machii — (1) Maintenir seats_available = places restantes (corrige un bug latent : jamais décrémenté),
--   ce qui fait marcher la division du prix ET masque les trajets pleins de la recherche.
-- (2) Notifier les passagers DÉJÀ confirmés quand un nouveau rejoint → leur prix baisse.

-- 1) seats_available = seats_total - somme des places acceptées ------------------
create or replace function public.recompute_trip_seats(p_trip_id uuid)
returns void language sql as $$
  update public.trips t
  set seats_available = greatest(0, t.seats_total - coalesce((
    select sum(b.seats_booked) from public.bookings b
    where b.trip_id = p_trip_id and b.status = 'accepted'), 0))
  where t.id = p_trip_id;
$$;

create or replace function public.trg_recompute_trip_seats()
returns trigger language plpgsql as $$
begin
  perform public.recompute_trip_seats(coalesce(new.trip_id, old.trip_id));
  return coalesce(new, old);
end $$;

drop trigger if exists trg_bookings_seats on public.bookings;
create trigger trg_bookings_seats
  after insert or update or delete on public.bookings
  for each row execute function public.trg_recompute_trip_seats();

-- backfill (trajets existants)
update public.trips t
set seats_available = greatest(0, t.seats_total - coalesce((
  select sum(b.seats_booked) from public.bookings b
  where b.trip_id = t.id and b.status = 'accepted'), 0));

-- 2) Notification de BAISSE DE PRIX aux passagers déjà confirmés -----------------
create or replace function public.notify_price_drop()
returns trigger language plpgsql as $$
declare
  v_trip public.trips%rowtype;
  v_occ int;
  v_new_price numeric;
  r record;
begin
  -- uniquement quand une réservation DEVIENT acceptée
  if new.status <> 'accepted' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'accepted' then return new; end if;

  select * into v_trip from public.trips where id = new.trip_id;
  if v_trip.price_total is null or v_trip.price_total <= 0 then return new; end if;

  v_occ := 1 + coalesce((select sum(seats_booked) from public.bookings
                         where trip_id = new.trip_id and status = 'accepted'), 0);
  v_new_price := round(v_trip.price_total::numeric / greatest(v_occ,1), 2);

  -- prévenir les AUTRES passagers acceptés (pas le nouveau)
  for r in
    select b.passenger_id, pt.expo_token
    from public.bookings b
    join public.push_tokens pt on pt.user_id = b.passenger_id
    where b.trip_id = new.trip_id and b.status = 'accepted' and b.passenger_id <> new.passenger_id
  loop
    perform public.send_expo_push(
      r.expo_token,
      'Bonne nouvelle : ton prix baisse ! 🎉',
      'Un nouveau passager a rejoint ' || v_trip.origin_label || ' → ' || v_trip.destination_label ||
        '. Ta participation passe à ' || v_new_price || ' DT (partagée à ' || v_occ || ').',
      jsonb_build_object('trip_id', new.trip_id, 'type', 'price_drop', 'new_price', v_new_price)
    );
  end loop;
  return new;
end $$;

drop trigger if exists trg_notify_price_drop on public.bookings;
create trigger trg_notify_price_drop
  after insert or update of status on public.bookings
  for each row execute function public.notify_price_drop();
