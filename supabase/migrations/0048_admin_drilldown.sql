-- ============================================================================
-- Machii — Console admin : drill-down du dashboard (chaque stat → sa liste)
--
-- 1. admin_list_users : + p_filter (new7 / drivers / verified / suspended)
-- 2. admin_list_trips : p_status accepte 'active' (= open+full+ongoing)
-- 3. admin_list_bookings : + p_status
-- 4. admin_list_requests : NOUVEAU — liste des demandes de trajet (l'onglet manquait)
-- Idempotent (drop + recreate pour les changements de signature).
-- ============================================================================

-- 1. Utilisateurs avec filtre -----------------------------------------------------
drop function if exists public.admin_list_users(text, int, int);
create or replace function public.admin_list_users(p_search text default null, p_filter text default null, p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, full_name text, phone text, city text, country text, gender text, role text,
  is_verified boolean, is_suspended boolean, is_admin boolean,
  rating_avg numeric, level int, xp int, created_at timestamptz,
  trips_count bigint, bookings_count bigint, reports_against bigint
) language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.phone, p.city, p.country, p.gender, p.role::text,
         p.is_verified, p.is_suspended, p.is_admin,
         p.rating_avg, p.level, p.xp, p.created_at,
         (select count(*) from trips t where t.driver_id = p.id),
         (select count(*) from bookings b where b.passenger_id = p.id),
         (select count(*) from reports r where r.reported_id = p.id)
  from profiles p
  where public._is_admin()
    and (p_search is null or p_search = ''
         or p.full_name ilike '%' || p_search || '%'
         or p.phone ilike '%' || p_search || '%'
         or p.city ilike '%' || p_search || '%')
    and (p_filter is null or p_filter = ''
         or (p_filter = 'new7'      and p.created_at > now() - interval '7 days')
         or (p_filter = 'drivers'   and p.role in ('driver', 'both'))
         or (p_filter = 'verified'  and p.is_verified)
         or (p_filter = 'suspended' and p.is_suspended))
  order by p.created_at desc
  limit least(coalesce(p_limit, 50), 200) offset greatest(coalesce(p_offset, 0), 0);
$$;
revoke all on function public.admin_list_users(text, text, int, int) from public, anon;
grant execute on function public.admin_list_users(text, text, int, int) to authenticated;

-- 2. Trajets : pseudo-statut 'active' ----------------------------------------------
create or replace function public.admin_list_trips(p_search text default null, p_status text default null, p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, origin_label text, destination_label text, departure_time timestamptz,
  status text, seats_available int, seats_total int, price_per_seat numeric, country text,
  women_only boolean, men_only boolean, created_at timestamptz,
  driver_id uuid, driver_name text, driver_phone text, bookings_count bigint
) language sql stable security definer set search_path = public as $$
  select t.id, t.origin_label, t.destination_label, t.departure_time,
         t.status::text, t.seats_available, t.seats_total, t.price_per_seat, t.country,
         t.women_only, t.men_only, t.created_at,
         p.id, p.full_name, p.phone,
         (select count(*) from bookings b where b.trip_id = t.id)
  from trips t join profiles p on p.id = t.driver_id
  where public._is_admin()
    and (p_status is null or p_status = ''
         or (p_status = 'active' and t.status in ('open', 'full', 'ongoing'))
         or t.status::text = p_status)
    and (p_search is null or p_search = ''
         or t.origin_label ilike '%' || p_search || '%'
         or t.destination_label ilike '%' || p_search || '%'
         or p.full_name ilike '%' || p_search || '%')
  order by t.departure_time desc
  limit least(coalesce(p_limit, 50), 200) offset greatest(coalesce(p_offset, 0), 0);
$$;
revoke all on function public.admin_list_trips(text, text, int, int) from public, anon;
grant execute on function public.admin_list_trips(text, text, int, int) to authenticated;

-- 3. Réservations : filtre statut ---------------------------------------------------
drop function if exists public.admin_list_bookings(int, int);
create or replace function public.admin_list_bookings(p_status text default null, p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, status text, seats_booked int, created_at timestamptz,
  origin_label text, destination_label text, departure_time timestamptz,
  passenger_name text, passenger_phone text, driver_name text
) language sql stable security definer set search_path = public as $$
  select b.id, b.status::text, b.seats_booked, b.created_at,
         t.origin_label, t.destination_label, t.departure_time,
         pp.full_name, pp.phone,
         (select full_name from profiles where id = t.driver_id)
  from bookings b
  join trips t on t.id = b.trip_id
  join profiles pp on pp.id = b.passenger_id
  where public._is_admin()
    and (p_status is null or p_status = '' or b.status::text = p_status)
  order by b.created_at desc
  limit least(coalesce(p_limit, 50), 200) offset greatest(coalesce(p_offset, 0), 0);
$$;
revoke all on function public.admin_list_bookings(text, int, int) from public, anon;
grant execute on function public.admin_list_bookings(text, int, int) to authenticated;

-- 4. Demandes de trajet (l'onglet manquant) -----------------------------------------
create or replace function public.admin_list_requests(p_status text default null, p_limit int default 100)
returns table (
  id uuid, created_at timestamptz, status text,
  origin_label text, destination_label text,
  departure_start timestamptz, departure_end timestamptz,
  seats_needed int, message text, country text,
  passenger_id uuid, passenger_name text, passenger_phone text
) language sql stable security definer set search_path = public as $$
  select r.id, r.created_at, r.status,
         r.origin_label, r.destination_label,
         r.departure_start, r.departure_end,
         r.seats_needed, r.message, r.country,
         p.id, p.full_name, p.phone
  from trip_requests r join profiles p on p.id = r.passenger_id
  where public._is_admin()
    and (p_status is null or p_status = '' or r.status = p_status)
  order by (r.status = 'open') desc, r.created_at desc
  limit least(coalesce(p_limit, 100), 200);
$$;
revoke all on function public.admin_list_requests(text, int) from public, anon;
grant execute on function public.admin_list_requests(text, int) to authenticated;
