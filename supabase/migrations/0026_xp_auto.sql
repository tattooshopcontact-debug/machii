-- ============================================================================
-- Machii — #17 : attribution AUTOMATIQUE de l'XP + recalcul du niveau.
--
-- Barème (décision #17) : +10 XP / trajet terminé, +5 XP / note donnée.
-- (Parrainage +20 et achievements +50 viendront avec leurs features.)
--
-- Niveaux alignés sur les paliers des thèmes : L1 0 · L2 100 · L3 300 · L4 600 · L5 1000.
--
-- Idempotent.
-- ============================================================================

-- Niveau en fonction de l'XP cumulé.
create or replace function public._level_for_xp(p_xp int)
returns int language sql immutable as $$
  select case
    when p_xp >= 1000 then 5
    when p_xp >= 600  then 4
    when p_xp >= 300  then 3
    when p_xp >= 100  then 2
    else 1
  end;
$$;

-- Ajoute de l'XP à un user et recalcule son niveau. SECURITY DEFINER pour que
-- les triggers déclenchés par n'importe quel utilisateur puissent écrire dans profiles.
create or replace function public.add_xp(p_user uuid, p_amount int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or coalesce(p_amount, 0) = 0 then
    return;
  end if;
  update public.profiles
    set xp = greatest(0, coalesce(xp, 0) + p_amount),
        level = public._level_for_xp(greatest(0, coalesce(xp, 0) + p_amount))
    where id = p_user;
end;
$$;

-- +10 XP au passager ET au conducteur quand une réservation passe à 'completed'.
create or replace function public._xp_on_trip_complete()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_driver uuid;
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    perform public.add_xp(new.passenger_id, 10);
    select driver_id into v_driver from public.trips where id = new.trip_id;
    perform public.add_xp(v_driver, 10);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_xp_on_trip_complete on public.bookings;
create trigger trg_xp_on_trip_complete
  after insert or update on public.bookings
  for each row execute function public._xp_on_trip_complete();

-- +5 XP à l'auteur d'une note.
create or replace function public._xp_on_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.add_xp(new.rater_id, 5);
  return new;
end;
$$;

drop trigger if exists trg_xp_on_rating on public.ratings;
create trigger trg_xp_on_rating
  after insert on public.ratings
  for each row execute function public._xp_on_rating();

-- Backfill : recale le niveau de tout le monde sur l'XP existant (cohérence).
update public.profiles set level = public._level_for_xp(coalesce(xp, 0));
