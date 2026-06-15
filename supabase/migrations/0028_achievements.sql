-- ============================================================================
-- Machii — #17 : achievements (badges) + déblocage automatique (+50 XP chacun).
--
-- 8 badges (cf src/constants/achievementsCatalog). Déblocage AUTO pour les 5
-- calculables (founding_member, fiable, coeur_genereux, excellence, triple_axe).
-- Les 3 événementiels (aid, ramadan, independance) sont définis mais accordés
-- manuellement (grant_achievement) faute de calendrier fiable en base.
--
-- Idempotent.
-- ============================================================================

create table if not exists public.user_achievements (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  key         text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_achievements enable row level security;

drop policy if exists "user_achievements read" on public.user_achievements;
create policy "user_achievements read" on public.user_achievements
  for select using (true); -- les badges sont publics (affichés sur les profils)

grant select on public.user_achievements to anon, authenticated;

-- Accorde un badge (idempotent) + 50 XP à la 1re obtention.
create or replace function public.grant_achievement(p_user uuid, p_key text)
returns void language plpgsql security definer set search_path = public as $$
declare v_rows int;
begin
  if p_user is null or p_key is null then return; end if;
  insert into public.user_achievements (user_id, key) values (p_user, p_key)
    on conflict (user_id, key) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    perform public.add_xp(p_user, 50);
  end if;
end;
$$;
revoke all on function public.grant_achievement(uuid, text) from public, anon, authenticated;

-- Évalue et accorde les badges calculables pour un user.
create or replace function public.check_achievements(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_completed int;
  v_free      int;
  v_recv      int;
  v_avg       numeric;
  v_cities    int;
begin
  if p_user is null then return; end if;

  -- Fiable : >= 5 trajets terminés (comme passager OU comme conducteur).
  select
    (select count(*) from public.bookings b where b.passenger_id = p_user and b.status = 'completed')
    + (select count(*) from public.bookings b join public.trips t on t.id = b.trip_id
        where t.driver_id = p_user and b.status = 'completed')
  into v_completed;
  if v_completed >= 5 then perform public.grant_achievement(p_user, 'fiable'); end if;

  -- Cœur Généreux : >= 3 trajets publiés gratuits (prix 0).
  select count(*) into v_free from public.trips
    where driver_id = p_user and price_per_seat = 0;
  if v_free >= 3 then perform public.grant_achievement(p_user, 'coeur_genereux'); end if;

  -- Excellence : note moyenne >= 4.8 sur >= 5 évaluations reçues.
  select count(*) into v_recv from public.ratings where ratee_id = p_user;
  select coalesce(rating_avg, 0) into v_avg from public.profiles where id = p_user;
  if v_recv >= 5 and v_avg >= 4.8 then perform public.grant_achievement(p_user, 'excellence'); end if;

  -- Triple Axe : trajets terminés touchant >= 3 villes distinctes.
  select count(*) into v_cities from (
    select t.origin_label as city from public.bookings b join public.trips t on t.id = b.trip_id
      where b.status = 'completed' and (b.passenger_id = p_user or t.driver_id = p_user)
    union
    select t.destination_label from public.bookings b join public.trips t on t.id = b.trip_id
      where b.status = 'completed' and (b.passenger_id = p_user or t.driver_id = p_user)
  ) c;
  if v_cities >= 3 then perform public.grant_achievement(p_user, 'triple_axe'); end if;
end;
$$;
grant execute on function public.check_achievements(uuid) to authenticated;

-- Founding Member : parmi les 100 premiers comptes.
create or replace function public._founding_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.profiles) <= 100 then
    perform public.grant_achievement(new.id, 'founding_member');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_founding_member on public.profiles;
create trigger trg_founding_member
  after insert on public.profiles
  for each row execute function public._founding_member();

-- Branche check_achievements sur les événements existants (trajet terminé, note).
create or replace function public._xp_on_trip_complete()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_driver uuid;
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    perform public.add_xp(new.passenger_id, 10);
    select driver_id into v_driver from public.trips where id = new.trip_id;
    perform public.add_xp(v_driver, 10);
    perform public.check_achievements(new.passenger_id);
    perform public.check_achievements(v_driver);
  end if;
  return new;
end;
$$;

create or replace function public._xp_on_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.add_xp(new.rater_id, 5);
  perform public.check_achievements(new.rater_id);
  perform public.check_achievements(new.ratee_id); -- sa note moyenne a changé (Excellence)
  return new;
end;
$$;
