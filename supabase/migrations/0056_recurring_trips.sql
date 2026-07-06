-- Machii — Trajets récurrents Phase 1 : modèle + robot de régénération + pause/reprise.
-- Un « modèle » (recurring_trips) décrit un trajet répétitif (jours + heures + aller-retour).
-- Une fonction idempotente maintient un horizon roulant de vrais trajets à venir.
-- pg_cron l'exécute chaque jour. Zéro tarif (ADN partage).

-- 1) Table modèle -----------------------------------------------------------
create table if not exists public.recurring_trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  origin_label text not null,
  destination_label text not null,
  origin geography(Point,4326) not null,
  destination geography(Point,4326) not null,
  departure_time_local time not null,          -- ex '07:30'
  days int[] not null,                          -- 0=dimanche .. 6=samedi (JS getDay)
  round_trip boolean not null default false,
  return_time_local time,                       -- ex '17:30' si round_trip
  seats_total int not null default 3,
  price_per_seat int,                           -- 0 = offert, null = à convenir
  country text not null default 'TN',
  women_only boolean not null default false,
  men_only boolean not null default false,
  allow_smoking boolean not null default false,
  allow_music boolean not null default true,
  allow_pets boolean not null default false,
  chat_level text,
  active boolean not null default true,         -- pause / reprise
  horizon_days int not null default 28,
  created_at timestamptz not null default now()
);

create index if not exists recurring_trips_driver_idx on public.recurring_trips(driver_id);

alter table public.recurring_trips enable row level security;

drop policy if exists rt_select_own on public.recurring_trips;
drop policy if exists rt_insert_own on public.recurring_trips;
drop policy if exists rt_update_own on public.recurring_trips;
drop policy if exists rt_delete_own on public.recurring_trips;
create policy rt_select_own on public.recurring_trips for select using (driver_id = auth.uid());
create policy rt_insert_own on public.recurring_trips for insert with check (driver_id = auth.uid());
create policy rt_update_own on public.recurring_trips for update using (driver_id = auth.uid());
create policy rt_delete_own on public.recurring_trips for delete using (driver_id = auth.uid());

-- 2) Générateur idempotent --------------------------------------------------
create or replace function public.generate_recurring_occurrences(p_template uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
  d date;
  dep timestamptz;
  ret timestamptz;
  n int := 0;
begin
  for t in
    select * from public.recurring_trips
    where active = true and (p_template is null or id = p_template)
  loop
    d := current_date;
    while d <= current_date + t.horizon_days loop
      if extract(dow from d)::int = any(t.days) then
        -- ALLER
        dep := (d + t.departure_time_local) at time zone 'Africa/Tunis';
        if dep > now() and not exists (
          select 1 from public.trips
          where driver_id = t.driver_id
            and origin_label = t.origin_label
            and destination_label = t.destination_label
            and departure_time = dep
        ) then
          insert into public.trips(driver_id, origin_label, destination_label, origin, destination,
            departure_time, seats_available, seats_total, price_per_seat, status, is_recurring, country,
            women_only, men_only, allow_smoking, allow_music, allow_pets, chat_level)
          values (t.driver_id, t.origin_label, t.destination_label, t.origin, t.destination,
            dep, t.seats_total, t.seats_total, t.price_per_seat, 'open', true, t.country,
            t.women_only, t.men_only, t.allow_smoking, t.allow_music, t.allow_pets, t.chat_level);
          n := n + 1;
        end if;
        -- RETOUR
        if t.round_trip and t.return_time_local is not null then
          ret := (d + t.return_time_local) at time zone 'Africa/Tunis';
          if ret > now() and not exists (
            select 1 from public.trips
            where driver_id = t.driver_id
              and origin_label = t.destination_label
              and destination_label = t.origin_label
              and departure_time = ret
          ) then
            insert into public.trips(driver_id, origin_label, destination_label, origin, destination,
              departure_time, seats_available, seats_total, price_per_seat, status, is_recurring, country,
              women_only, men_only, allow_smoking, allow_music, allow_pets, chat_level)
            values (t.driver_id, t.destination_label, t.origin_label, t.destination, t.origin,
              ret, t.seats_total, t.seats_total, t.price_per_seat, 'open', true, t.country,
              t.women_only, t.men_only, t.allow_smoking, t.allow_music, t.allow_pets, t.chat_level);
            n := n + 1;
          end if;
        end if;
      end if;
      d := d + 1;
    end loop;
  end loop;
  return n;
end;
$$;

revoke all on function public.generate_recurring_occurrences(uuid) from public, anon, authenticated;

-- 3) RPC de création (appelée par le site) ----------------------------------
create or replace function public.create_recurring_trip(
  p_origin_label text, p_destination_label text,
  p_origin text, p_destination text,           -- WKT 'SRID=4326;POINT(lng lat)'
  p_departure_time time, p_days int[],
  p_round_trip boolean, p_return_time time,
  p_seats int, p_price int, p_country text,
  p_women_only boolean, p_men_only boolean,
  p_smoking boolean, p_music boolean, p_pets boolean, p_chat text
) returns table(template_id uuid, created int)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_uid uuid := auth.uid(); v_id uuid; v_n int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_days is null or array_length(p_days,1) is null then raise exception 'no_days'; end if;
  if p_origin_label = p_destination_label then raise exception 'route_invalide'; end if;
  insert into public.recurring_trips(driver_id, origin_label, destination_label, origin, destination,
    departure_time_local, days, round_trip, return_time_local, seats_total, price_per_seat, country,
    women_only, men_only, allow_smoking, allow_music, allow_pets, chat_level)
  values (v_uid, p_origin_label, p_destination_label, p_origin::geography, p_destination::geography,
    p_departure_time, p_days, coalesce(p_round_trip,false), p_return_time,
    greatest(1, least(6, coalesce(p_seats,3))), p_price, coalesce(p_country,'TN'),
    coalesce(p_women_only,false), coalesce(p_men_only,false), coalesce(p_smoking,false),
    coalesce(p_music,true), coalesce(p_pets,false), p_chat)
  returning id into v_id;
  select public.generate_recurring_occurrences(v_id) into v_n;
  return query select v_id, v_n;
end;
$$;

revoke all on function public.create_recurring_trip(text,text,text,text,time,int[],boolean,time,int,int,text,boolean,boolean,boolean,boolean,boolean,text) from public, anon;
grant execute on function public.create_recurring_trip(text,text,text,text,time,int[],boolean,time,int,int,text,boolean,boolean,boolean,boolean,boolean,text) to authenticated;

-- 4) Planning quotidien (pg_cron) -------------------------------------------
select cron.schedule('machii-regen-recurring', '0 3 * * *', $cron$select public.generate_recurring_occurrences()$cron$);
