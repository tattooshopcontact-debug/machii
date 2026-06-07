-- ============================================================================
-- Machii — Chat : création auto de conversation + anti-contournement
--
-- 1) Quand une booking passe à 'accepted', on crée la conversation associée
--    (driver = trip.driver_id, passenger = booking.passenger_id) si elle
--    n'existe pas encore.
-- 2) Tout message qui contient un numéro de téléphone, un email ou un mot
--    clé de canal externe (WhatsApp, Telegram, etc.) est marqué `blocked=true`
--    et son contenu est remplacé par un message neutre. Le but : forcer la
--    discussion à rester dans l'app jusqu'à acceptation officielle.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Auto-create conversation quand booking accepted
-- ---------------------------------------------------------------------------

create or replace function public.handle_booking_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_driver uuid;
begin
  -- Ne déclenche que sur transition vers 'accepted'.
  if new.status <> 'accepted' or (old is not null and old.status = 'accepted') then
    return new;
  end if;

  select t.driver_id into v_driver from public.trips t where t.id = new.trip_id;
  if v_driver is null then return new; end if;

  insert into public.conversations (trip_id, driver_id, passenger_id)
  values (new.trip_id, v_driver, new.passenger_id)
  on conflict (trip_id, passenger_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_booking_accepted on public.bookings;
create trigger on_booking_accepted
  after update of status on public.bookings
  for each row execute function public.handle_booking_accepted();

-- ---------------------------------------------------------------------------
-- 2) Anti-contournement message
--    Détecte téléphone (TN ou international), email, WhatsApp/Telegram.
--    Remplace le contenu par un message neutre + flag blocked=true.
-- ---------------------------------------------------------------------------

create or replace function public.handle_message_anti_bypass()
returns trigger language plpgsql as $$
declare
  v_pattern text;
  v_blocked boolean := false;
begin
  -- Téléphone : 6+ chiffres consécutifs, avec ou sans séparateurs.
  v_pattern := '(\+?\d[\s.\-]?){6,}';
  if new.content ~ v_pattern then
    v_blocked := true;
  end if;

  -- Email
  if new.content ~* '[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}' then
    v_blocked := true;
  end if;

  -- Mots-clés canal externe
  if new.content ~* '\m(whatsapp|telegram|viber|messenger|signal|insta(gram)?|facebook|skype)\M' then
    v_blocked := true;
  end if;

  if v_blocked then
    new.blocked := true;
    new.content := 'Message bloqué (échange de coordonnées avant acceptation interdit).';
  end if;

  return new;
end;
$$;

drop trigger if exists on_message_insert_check on public.messages;
create trigger on_message_insert_check
  before insert on public.messages
  for each row execute function public.handle_message_anti_bypass();
