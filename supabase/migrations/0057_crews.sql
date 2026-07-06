-- Machii — Trajets récurrents Phase 2 : Équipages de secteur à tour de rôle.
-- 2-3 personnes même route domicile-travail → UNE voiture, rotation hebdo du conducteur.
-- Rejoindre par code d'invitation. Zéro argent (ADN partage). Angle trafic/pollution.

-- 1) Tables -----------------------------------------------------------------
create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  origin_label text not null,
  destination_label text not null,
  distance_km int not null default 0,
  days int[] not null,                       -- 0=dim..6=sam (jours de trajet)
  departure_time time not null,
  return_time time,
  country text not null default 'TN',
  join_code text not null unique,            -- code d'invitation (6 car.)
  rotation_start date not null default current_date,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.crew_members (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  active boolean not null default true,
  unique(crew_id, user_id)
);
create index if not exists crew_members_crew_idx on public.crew_members(crew_id);
create index if not exists crew_members_user_idx on public.crew_members(user_id);

-- RLS : tout passe par les RPC SECURITY DEFINER. Accès direct minimal.
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
drop policy if exists crew_members_own on public.crew_members;
create policy crew_members_own on public.crew_members for select using (user_id = auth.uid());

-- 2) Créer un équipage ------------------------------------------------------
create or replace function public.create_crew(
  p_name text, p_origin_label text, p_destination_label text, p_distance_km int,
  p_days int[], p_departure time, p_return time, p_country text
) returns table(crew_id uuid, join_code text)
language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_id uuid; v_code text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_days is null or array_length(p_days,1) is null then raise exception 'no_days'; end if;
  if p_origin_label = p_destination_label then raise exception 'route_invalide'; end if;
  loop
    v_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from public.crews where crews.join_code = v_code);
  end loop;
  insert into public.crews(name, origin_label, destination_label, distance_km, days, departure_time, return_time, country, join_code, created_by)
  values (coalesce(nullif(p_name,''), p_origin_label || ' → ' || p_destination_label),
          p_origin_label, p_destination_label, coalesce(p_distance_km,0), p_days, p_departure, p_return,
          coalesce(p_country,'TN'), v_code, v_uid)
  returning id into v_id;
  insert into public.crew_members(crew_id, user_id) values (v_id, v_uid);
  return query select v_id, v_code;
end; $fn$;

-- 3) Rejoindre par code -----------------------------------------------------
create or replace function public.join_crew(p_code text)
returns uuid language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_crew uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select id into v_crew from public.crews where join_code = upper(trim(p_code));
  if v_crew is null then raise exception 'code_invalide'; end if;
  insert into public.crew_members(crew_id, user_id) values (v_crew, v_uid)
    on conflict (crew_id, user_id) do update set active = true;
  return v_crew;
end; $fn$;

-- 4) Quitter ----------------------------------------------------------------
create or replace function public.leave_crew(p_crew_id uuid)
returns void language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  delete from public.crew_members where crew_id = p_crew_id and user_id = v_uid;
end; $fn$;

-- 5) Mes équipages ----------------------------------------------------------
create or replace function public.get_my_crews()
returns table(id uuid, name text, origin_label text, destination_label text, days int[], departure_time time, member_count int)
language sql security definer set search_path = public as $fn$
  select c.id, c.name, c.origin_label, c.destination_label, c.days, c.departure_time,
    (select count(*) from public.crew_members m2 where m2.crew_id = c.id and m2.active)::int
  from public.crews c
  where exists (select 1 from public.crew_members m where m.crew_id = c.id and m.user_id = auth.uid() and m.active)
  order by c.created_at desc;
$fn$;

-- 6) Détail équipage (JSON : membres + rotation hebdo + impact) --------------
create or replace function public.get_crew(p_crew_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  c record;
  v_members jsonb;
  v_ids uuid[];
  v_n int;
  v_base int;
  v_rot jsonb := '[]'::jsonb;
  v_days int;
  v_weeks int;
  v_co2 numeric;
  i int;
  wk date;
  di int;
  drv uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.crew_members where crew_id = p_crew_id and user_id = v_uid and active) then
    raise exception 'not_member';
  end if;
  select * into c from public.crews where id = p_crew_id;
  select jsonb_agg(jsonb_build_object('user_id', p.id, 'name', p.full_name,
           'avatar_key', p.avatar_key, 'avatar_url', p.avatar_url, 'is_me', p.id = v_uid) order by m.joined_at),
         array_agg(p.id order by m.joined_at)
    into v_members, v_ids
    from public.crew_members m join public.profiles p on p.id = m.user_id
    where m.crew_id = p_crew_id and m.active;
  v_n := coalesce(array_length(v_ids,1), 0);
  if v_n > 0 then
    v_base := floor((date_trunc('week', current_date)::date - date_trunc('week', c.rotation_start)::date) / 7.0)::int;
    i := 0;
    while i <= 5 loop
      wk := date_trunc('week', current_date)::date + (i * 7);
      di := ((v_base + i) % v_n + v_n) % v_n;
      drv := v_ids[di + 1];
      v_rot := v_rot || jsonb_build_object('week_start', wk, 'driver_id', drv,
        'driver_name', (select full_name from public.profiles where id = drv), 'is_me', drv = v_uid);
      i := i + 1;
    end loop;
  end if;
  v_days := coalesce(array_length(c.days,1), 0);
  v_weeks := greatest(0, floor((current_date - c.rotation_start) / 7.0)::int) + 1;
  v_co2 := greatest(0, v_n - 1) * c.distance_km * 2 * (v_weeks * v_days) * 0.12;
  return jsonb_build_object(
    'id', c.id, 'name', c.name, 'origin_label', c.origin_label, 'destination_label', c.destination_label,
    'days', c.days, 'departure_time', to_char(c.departure_time,'HH24:MI'),
    'return_time', case when c.return_time is null then null else to_char(c.return_time,'HH24:MI') end,
    'join_code', c.join_code, 'member_count', v_n,
    'members', coalesce(v_members, '[]'::jsonb), 'rotation', v_rot,
    'impact', jsonb_build_object('cars_saved', greatest(0, v_n - 1), 'co2_kg', round(v_co2))
  );
end; $fn$;

-- 7) Droits -----------------------------------------------------------------
revoke all on function public.create_crew(text,text,text,int,int[],time,time,text) from public, anon;
revoke all on function public.join_crew(text) from public, anon;
revoke all on function public.leave_crew(uuid) from public, anon;
revoke all on function public.get_my_crews() from public, anon;
revoke all on function public.get_crew(uuid) from public, anon;
grant execute on function public.create_crew(text,text,text,int,int[],time,time,text) to authenticated;
grant execute on function public.join_crew(text) to authenticated;
grant execute on function public.leave_crew(uuid) to authenticated;
grant execute on function public.get_my_crews() to authenticated;
grant execute on function public.get_crew(uuid) to authenticated;
