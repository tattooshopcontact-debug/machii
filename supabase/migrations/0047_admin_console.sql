-- ============================================================================
-- Machii — Console d'administration (Vague 1 : backend complet)
--
-- S'appuie sur 0037 (profiles.is_admin + durcissement + admin_list_kyc/review).
-- Ajoute :
--  1. profiles.is_suspended + protection (extension du guard 0037) ;
--  2. suspension EFFECTIVE côté serveur (triggers : un suspendu ne peut plus
--     publier / réserver / écrire / demander) ;
--  3. table reports (réclamations/signalements) + RLS ;
--  4. table admin_actions (journal d'audit de chaque action admin) ;
--  5. RPCs admin_* (SECURITY DEFINER, gated is_admin, jamais exécutables anon).
--
-- Le site étant statique (anon key publique), TOUTE la sécurité est ici :
-- sans is_admin=true en base, chaque fonction ne renvoie rien / refuse.
-- Idempotent.
-- ============================================================================

-- 1. Suspension ------------------------------------------------------------------
alter table public.profiles add column if not exists is_suspended boolean not null default false;

-- Étend le guard 0037 : is_admin / is_verified / is_suspended inaltérables par le user.
create or replace function public.guard_profile_privileged_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.is_admin is distinct from old.is_admin
     or new.is_verified is distinct from old.is_verified
     or new.is_suspended is distinct from old.is_suspended then
    if current_user not in ('postgres', 'supabase_admin', 'service_role')
       and not coalesce((select is_admin from profiles where id = auth.uid()), false) then
      raise exception 'forbidden: privileged column change';
    end if;
  end if;
  return new;
end;
$$;

-- Helper : l'appelant est-il admin ?
create or replace function public._is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;
revoke all on function public._is_admin() from public, anon;
grant execute on function public._is_admin() to authenticated;

-- 2. Suspension effective : bloque les écritures des comptes suspendus ------------
create or replace function public._assert_not_suspended()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce((select is_suspended from profiles where id = auth.uid()), false) then
    raise exception 'account_suspended';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_suspended_trips on public.trips;
create trigger trg_suspended_trips before insert on public.trips
  for each row execute function public._assert_not_suspended();
drop trigger if exists trg_suspended_bookings on public.bookings;
create trigger trg_suspended_bookings before insert on public.bookings
  for each row execute function public._assert_not_suspended();
drop trigger if exists trg_suspended_messages on public.messages;
create trigger trg_suspended_messages before insert on public.messages
  for each row execute function public._assert_not_suspended();
drop trigger if exists trg_suspended_requests on public.trip_requests;
create trigger trg_suspended_requests before insert on public.trip_requests
  for each row execute function public._assert_not_suspended();

-- 3. Réclamations / signalements ---------------------------------------------------
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references public.profiles(id) on delete set null,
  reported_id  uuid references public.profiles(id) on delete cascade,
  trip_id      uuid references public.trips(id) on delete set null,
  booking_id   uuid references public.bookings(id) on delete set null,
  reason       text not null check (reason in ('comportement','securite','fraude','annulation','autre')),
  details      text,
  status       text not null default 'new' check (status in ('new','in_progress','resolved')),
  admin_notes  text,
  resolved_by  uuid references public.profiles(id),
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.reports enable row level security;
drop policy if exists "reports insert own" on public.reports;
create policy "reports insert own" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
drop policy if exists "reports select own" on public.reports;
create policy "reports select own" on public.reports for select to authenticated
  using (reporter_id = auth.uid());
-- (pas d'update/delete côté user ; l'admin passe par les RPCs definer)

-- 4. Journal d'audit ---------------------------------------------------------------
create table if not exists public.admin_actions (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);
alter table public.admin_actions enable row level security;
drop policy if exists "admin_actions admin read" on public.admin_actions;
create policy "admin_actions admin read" on public.admin_actions for select to authenticated
  using (public._is_admin());

create or replace function public._admin_log(p_action text, p_type text, p_id text, p_details jsonb default null)
returns void language sql security definer set search_path = public as $$
  insert into admin_actions (admin_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_type, p_id, p_details);
$$;
revoke all on function public._admin_log(text, text, text, jsonb) from public, anon, authenticated;

-- 5. RPCs admin ---------------------------------------------------------------------

-- Suis-je admin ? (garde d'accès du front)
create or replace function public.admin_me()
returns boolean language sql stable security definer set search_path = public as $$
  select public._is_admin();
$$;
revoke all on function public.admin_me() from public, anon;
grant execute on function public.admin_me() to authenticated;

-- Chiffres clés du dashboard
create or replace function public.admin_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public._is_admin() then null else jsonb_build_object(
    'users_total',     (select count(*) from profiles),
    'users_drivers',   (select count(*) from profiles where role in ('driver','both')),
    'users_verified',  (select count(*) from profiles where is_verified),
    'users_suspended', (select count(*) from profiles where is_suspended),
    'users_7d',        (select count(*) from profiles where created_at > now() - interval '7 days'),
    'trips_total',     (select count(*) from trips),
    'trips_active',    (select count(*) from trips where status in ('open','full','ongoing')),
    'bookings_total',  (select count(*) from bookings),
    'bookings_pending',(select count(*) from bookings where status = 'pending'),
    'requests_open',   (select count(*) from trip_requests where status = 'open'),
    'messages_total',  (select count(*) from messages),
    'messages_blocked',(select count(*) from messages where blocked),
    'ratings_total',   (select count(*) from ratings),
    'reports_new',     (select count(*) from reports where status = 'new'),
    'kyc_pending',     (select count(*) from kyc_documents where status = 'pending')
  ) end;
$$;
revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- Liste utilisateurs (recherche nom/téléphone/ville, pagination)
create or replace function public.admin_list_users(p_search text default null, p_limit int default 50, p_offset int default 0)
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
  order by p.created_at desc
  limit least(coalesce(p_limit, 50), 200) offset greatest(coalesce(p_offset, 0), 0);
$$;
revoke all on function public.admin_list_users(text, int, int) from public, anon;
grant execute on function public.admin_list_users(text, int, int) to authenticated;

-- Fiche utilisateur complète
create or replace function public.admin_user_detail(p_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public._is_admin() then null else jsonb_build_object(
    'profile', (select to_jsonb(p) from profiles p where p.id = p_id),
    'vehicle', (select to_jsonb(v) from vehicles v where v.driver_id = p_id limit 1),
    'trips', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', t.id, 'from', t.origin_label, 'to', t.destination_label,
        'departure', t.departure_time, 'status', t.status,
        'seats', t.seats_available || '/' || t.seats_total, 'price', t.price_per_seat,
        'bookings', (select count(*) from bookings b where b.trip_id = t.id)
      ) order by t.departure_time desc), '[]'::jsonb)
      from (select * from trips where driver_id = p_id order by departure_time desc limit 20) t),
    'bookings', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id, 'status', b.status, 'seats', b.seats_booked, 'created', b.created_at,
        'from', t.origin_label, 'to', t.destination_label, 'departure', t.departure_time,
        'driver', (select full_name from profiles where id = t.driver_id)
      ) order by b.created_at desc), '[]'::jsonb)
      from (select * from bookings where passenger_id = p_id order by created_at desc limit 20) b
      join trips t on t.id = b.trip_id),
    'ratings_received', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id, 'created', r.created_at, 'comment', r.comment,
        'avg', round((r.punctuality + r.cleanliness + r.driving + r.friendliness) / 4.0, 1),
        'rater', (select full_name from profiles where id = r.rater_id)
      ) order by r.created_at desc), '[]'::jsonb)
      from (select * from ratings where ratee_id = p_id order by created_at desc limit 20) r),
    'kyc', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', d.id, 'type', d.doc_type, 'status', d.status, 'created', d.created_at, 'path', d.file_path
      ) order by d.created_at desc), '[]'::jsonb)
      from kyc_documents d where d.profile_id = p_id),
    'reports_against', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id, 'reason', r.reason, 'status', r.status, 'details', r.details, 'created', r.created_at,
        'reporter', (select full_name from profiles where id = r.reporter_id)
      ) order by r.created_at desc), '[]'::jsonb)
      from reports r where r.reported_id = p_id),
    'referrals_count', (select count(*) from profiles pr where pr.referred_by = p_id),
    'emergency_contacts', (select count(*) from emergency_contacts e where e.user_id = p_id),
    'conversations_count', (select count(*) from conversations c where c.driver_id = p_id or c.passenger_id = p_id)
  ) end;
$$;
revoke all on function public.admin_user_detail(uuid) from public, anon;
grant execute on function public.admin_user_detail(uuid) to authenticated;

-- Actions utilisateur
create or replace function public.admin_set_verified(p_id uuid, p_val boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public._is_admin() then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  update profiles set is_verified = p_val where id = p_id;
  perform _admin_log(case when p_val then 'verify_user' else 'unverify_user' end, 'profile', p_id::text, null);
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.admin_set_verified(uuid, boolean) from public, anon;
grant execute on function public.admin_set_verified(uuid, boolean) to authenticated;

create or replace function public.admin_set_suspended(p_id uuid, p_val boolean, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public._is_admin() then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  if coalesce((select is_admin from profiles where id = p_id), false) then
    return jsonb_build_object('ok', false, 'reason', 'cannot_suspend_admin');
  end if;
  update profiles set is_suspended = p_val where id = p_id;
  perform _admin_log(case when p_val then 'suspend_user' else 'unsuspend_user' end, 'profile', p_id::text,
                     jsonb_build_object('reason', p_reason));
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.admin_set_suspended(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_suspended(uuid, boolean, text) to authenticated;

-- Trajets
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
    and (p_status is null or p_status = '' or t.status::text = p_status)
    and (p_search is null or p_search = ''
         or t.origin_label ilike '%' || p_search || '%'
         or t.destination_label ilike '%' || p_search || '%'
         or p.full_name ilike '%' || p_search || '%')
  order by t.departure_time desc
  limit least(coalesce(p_limit, 50), 200) offset greatest(coalesce(p_offset, 0), 0);
$$;
revoke all on function public.admin_list_trips(text, text, int, int) from public, anon;
grant execute on function public.admin_list_trips(text, text, int, int) to authenticated;

create or replace function public.admin_cancel_trip(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public._is_admin() then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  update trips set status = 'cancelled' where id = p_id;
  update bookings set status = 'cancelled' where trip_id = p_id and status in ('pending','accepted');
  perform _admin_log('cancel_trip', 'trip', p_id::text, null);
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.admin_cancel_trip(uuid) from public, anon;
grant execute on function public.admin_cancel_trip(uuid) to authenticated;

-- Réservations
create or replace function public.admin_list_bookings(p_limit int default 50, p_offset int default 0)
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
  order by b.created_at desc
  limit least(coalesce(p_limit, 50), 200) offset greatest(coalesce(p_offset, 0), 0);
$$;
revoke all on function public.admin_list_bookings(int, int) from public, anon;
grant execute on function public.admin_list_bookings(int, int) to authenticated;

-- Messagerie (modération)
create or replace function public.admin_list_conversations(p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, created_at timestamptz,
  driver_name text, passenger_name text,
  trip_label text, messages_count bigint, blocked_count bigint, last_message_at timestamptz
) language sql stable security definer set search_path = public as $$
  select c.id, c.created_at,
         (select full_name from profiles where id = c.driver_id),
         (select full_name from profiles where id = c.passenger_id),
         (select origin_label || ' → ' || destination_label from trips where id = c.trip_id),
         (select count(*) from messages m where m.conversation_id = c.id),
         (select count(*) from messages m where m.conversation_id = c.id and m.blocked),
         (select max(created_at) from messages m where m.conversation_id = c.id)
  from conversations c
  where public._is_admin()
  order by (select max(created_at) from messages m where m.conversation_id = c.id) desc nulls last
  limit least(coalesce(p_limit, 50), 200) offset greatest(coalesce(p_offset, 0), 0);
$$;
revoke all on function public.admin_list_conversations(int, int) from public, anon;
grant execute on function public.admin_list_conversations(int, int) to authenticated;

create or replace function public.admin_get_messages(p_conv uuid)
returns table (id uuid, sender_name text, content text, blocked boolean, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.id, (select full_name from profiles where id = m.sender_id), m.content, m.blocked, m.created_at
  from messages m
  where public._is_admin() and m.conversation_id = p_conv
  order by m.created_at asc
  limit 500;
$$;
revoke all on function public.admin_get_messages(uuid) from public, anon;
grant execute on function public.admin_get_messages(uuid) to authenticated;

-- Avis / notes
create or replace function public.admin_list_ratings(p_limit int default 50, p_offset int default 0)
returns table (
  id uuid, created_at timestamptz, avg numeric, comment text,
  rater_name text, ratee_name text, trip_label text,
  punctuality int, cleanliness int, driving int, friendliness int
) language sql stable security definer set search_path = public as $$
  select r.id, r.created_at,
         round((r.punctuality + r.cleanliness + r.driving + r.friendliness) / 4.0, 1),
         r.comment,
         (select full_name from profiles where id = r.rater_id),
         (select full_name from profiles where id = r.ratee_id),
         (select origin_label || ' → ' || destination_label from trips where id = r.trip_id),
         r.punctuality, r.cleanliness, r.driving, r.friendliness
  from ratings r
  where public._is_admin()
  order by r.created_at desc
  limit least(coalesce(p_limit, 50), 200) offset greatest(coalesce(p_offset, 0), 0);
$$;
revoke all on function public.admin_list_ratings(int, int) from public, anon;
grant execute on function public.admin_list_ratings(int, int) to authenticated;

create or replace function public.admin_delete_rating(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ratee uuid;
begin
  if not public._is_admin() then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  delete from ratings where id = p_id returning ratee_id into v_ratee;
  if v_ratee is null then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  -- Recalcule la moyenne du noté après suppression.
  update profiles set rating_avg = coalesce((
    select round(avg((punctuality + cleanliness + driving + friendliness) / 4.0), 2)
    from ratings where ratee_id = v_ratee
  ), 0) where id = v_ratee;
  perform _admin_log('delete_rating', 'rating', p_id::text, jsonb_build_object('ratee', v_ratee));
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.admin_delete_rating(uuid) from public, anon;
grant execute on function public.admin_delete_rating(uuid) to authenticated;

-- Réclamations
create or replace function public.admin_list_reports(p_status text default null)
returns table (
  id uuid, created_at timestamptz, reason text, details text, status text, admin_notes text,
  reporter_name text, reporter_phone text, reported_name text, reported_id uuid, trip_label text
) language sql stable security definer set search_path = public as $$
  select r.id, r.created_at, r.reason, r.details, r.status, r.admin_notes,
         (select full_name from profiles where id = r.reporter_id),
         (select phone from profiles where id = r.reporter_id),
         (select full_name from profiles where id = r.reported_id),
         r.reported_id,
         (select origin_label || ' → ' || destination_label from trips where id = r.trip_id)
  from reports r
  where public._is_admin()
    and (p_status is null or p_status = '' or r.status = p_status)
  order by (r.status = 'new') desc, r.created_at desc
  limit 200;
$$;
revoke all on function public.admin_list_reports(text) from public, anon;
grant execute on function public.admin_list_reports(text) to authenticated;

create or replace function public.admin_update_report(p_id uuid, p_status text, p_notes text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public._is_admin() then return jsonb_build_object('ok', false, 'reason', 'not_admin'); end if;
  if p_status not in ('new','in_progress','resolved') then
    return jsonb_build_object('ok', false, 'reason', 'bad_status');
  end if;
  update reports
     set status = p_status,
         admin_notes = coalesce(p_notes, admin_notes),
         resolved_by = case when p_status = 'resolved' then auth.uid() else resolved_by end,
         resolved_at = case when p_status = 'resolved' then now() else null end
   where id = p_id;
  perform _admin_log('update_report', 'report', p_id::text, jsonb_build_object('status', p_status));
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.admin_update_report(uuid, text, text) from public, anon;
grant execute on function public.admin_update_report(uuid, text, text) to authenticated;

-- Journal des actions admin (consultation)
create or replace function public.admin_list_actions(p_limit int default 100)
returns table (id uuid, created_at timestamptz, admin_name text, action text, target_type text, target_id text, details jsonb)
language sql stable security definer set search_path = public as $$
  select a.id, a.created_at, (select full_name from profiles where id = a.admin_id), a.action, a.target_type, a.target_id, a.details
  from admin_actions a
  where public._is_admin()
  order by a.created_at desc
  limit least(coalesce(p_limit, 100), 500);
$$;
revoke all on function public.admin_list_actions(int) from public, anon;
grant execute on function public.admin_list_actions(int) to authenticated;
