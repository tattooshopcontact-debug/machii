-- ============================================================================
-- Machii — Push notifications (Expo Push)
--
-- 1) Table public.push_tokens (user_id + expo_token + platform)
-- 2) Helper public.send_expo_push(token, title, body, data) qui envoie via
--    Expo Push API (gratuit, illimite) via pg_net.
-- 3) Triggers :
--    - INSERT booking pending     → notif au driver "Nouvelle demande de X"
--    - UPDATE booking accepted    → notif au passager "Ta demande a ete acceptee"
--    - UPDATE booking rejected    → notif au passager "Ta demande a ete refusee"
--    - INSERT message (non bloque) → notif a l'autre membre de la conversation
-- ============================================================================

create extension if not exists pg_net with schema extensions;

-- ----------------------------------------------------------------------------
-- Table push_tokens
-- ----------------------------------------------------------------------------
create table if not exists public.push_tokens (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  expo_token text not null,
  platform   text not null check (platform in ('ios','android','web')),
  updated_at timestamptz not null default now()
);

alter table public.push_tokens enable row level security;

drop policy if exists "push_tokens self" on public.push_tokens;
create policy "push_tokens self" on public.push_tokens for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Helper : envoi via Expo Push API
-- ----------------------------------------------------------------------------
create or replace function public.send_expo_push(
  p_token text,
  p_title text,
  p_body  text,
  p_data  jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_payload jsonb;
begin
  if p_token is null or length(p_token) = 0 then return; end if;

  v_payload := jsonb_build_object(
    'to', p_token,
    'title', p_title,
    'body', p_body,
    'sound', 'default',
    'data', coalesce(p_data, '{}'::jsonb)
  );

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept', 'application/json',
      'Accept-Encoding', 'gzip, deflate'
    ),
    body := v_payload
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- Trigger 1 : nouvelle demande de reservation
-- ----------------------------------------------------------------------------
create or replace function public.notify_booking_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_driver_token text;
  v_passenger_name text;
  v_trip record;
begin
  if new.status <> 'pending' then return new; end if;

  select t.driver_id, t.origin_label, t.destination_label
    into v_trip
  from public.trips t where t.id = new.trip_id;

  if v_trip is null then return new; end if;

  select expo_token into v_driver_token
    from public.push_tokens where user_id = v_trip.driver_id;

  select coalesce(full_name, 'Quelqu''un') into v_passenger_name
    from public.profiles where id = new.passenger_id;

  perform public.send_expo_push(
    v_driver_token,
    'Nouvelle demande',
    v_passenger_name || ' veut reserver ' || v_trip.origin_label || ' → ' || v_trip.destination_label,
    jsonb_build_object('type','booking_request','booking_id', new.id, 'trip_id', new.trip_id)
  );

  return new;
end;
$$;

drop trigger if exists on_booking_request_notify on public.bookings;
create trigger on_booking_request_notify
  after insert on public.bookings
  for each row execute function public.notify_booking_request();

-- ----------------------------------------------------------------------------
-- Trigger 2 : reponse a une demande (accepted ou rejected)
-- ----------------------------------------------------------------------------
create or replace function public.notify_booking_response()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_passenger_token text;
  v_trip record;
  v_title text;
  v_body  text;
begin
  -- Ne declenche que sur transitions accepted ou rejected, depuis pending.
  if (old.status = new.status) then return new; end if;
  if new.status not in ('accepted','rejected') then return new; end if;

  select t.origin_label, t.destination_label into v_trip
    from public.trips t where t.id = new.trip_id;
  if v_trip is null then return new; end if;

  select expo_token into v_passenger_token
    from public.push_tokens where user_id = new.passenger_id;

  if new.status = 'accepted' then
    v_title := 'Demande acceptee';
    v_body := 'Ta demande pour ' || v_trip.origin_label || ' → ' || v_trip.destination_label || ' a ete acceptee.';
  else
    v_title := 'Demande refusee';
    v_body := 'Ta demande pour ' || v_trip.origin_label || ' → ' || v_trip.destination_label || ' a ete refusee.';
  end if;

  perform public.send_expo_push(
    v_passenger_token,
    v_title,
    v_body,
    jsonb_build_object('type','booking_response','booking_id', new.id, 'status', new.status)
  );

  return new;
end;
$$;

drop trigger if exists on_booking_response_notify on public.bookings;
create trigger on_booking_response_notify
  after update of status on public.bookings
  for each row execute function public.notify_booking_response();

-- ----------------------------------------------------------------------------
-- Trigger 3 : nouveau message (pas bloque)
-- ----------------------------------------------------------------------------
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_conv record;
  v_other uuid;
  v_token text;
  v_sender_name text;
begin
  -- On notifie pas pour les messages bloques (le destinataire ne les voit pas
  -- comme un vrai message).
  if new.blocked then return new; end if;

  select driver_id, passenger_id into v_conv
    from public.conversations where id = new.conversation_id;
  if v_conv is null then return new; end if;

  v_other := case when new.sender_id = v_conv.driver_id then v_conv.passenger_id else v_conv.driver_id end;

  select expo_token into v_token from public.push_tokens where user_id = v_other;
  select coalesce(full_name, 'Quelqu''un') into v_sender_name
    from public.profiles where id = new.sender_id;

  perform public.send_expo_push(
    v_token,
    v_sender_name,
    substr(new.content, 1, 120),
    jsonb_build_object('type','new_message','conversation_id', new.conversation_id, 'message_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists on_new_message_notify on public.messages;
create trigger on_new_message_notify
  after insert on public.messages
  for each row execute function public.notify_new_message();
