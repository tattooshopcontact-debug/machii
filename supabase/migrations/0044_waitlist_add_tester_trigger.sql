-- ============================================================================
-- Machii — Auto-ajout testeur : à chaque inscription Android via la popup
-- « Télécharger l'app » (waitlist, platform='android', email présent), on appelle
-- côté serveur la fonction Edge `add-tester` qui ajoute l'email au groupe Google
-- `testeurs@machii.net` (= liste testeurs du test fermé Play).
--
-- 100% serveur (le secret `x-gate` n'est jamais exposé au navigateur).
-- Tant que la config Google n'est pas posée, add-tester renvoie `not_configured`
-- et le déclencheur ne casse rien (net.http_post = fire-and-forget).
-- pg_net déjà activé (0006/0010). Idempotent.
-- ============================================================================

create or replace function public.on_waitlist_android_add_tester()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.platform = 'android' and new.email is not null and new.email <> '' then
    perform net.http_post(
      url := 'https://qtgqvwfzwjprclqrkfue.supabase.co/functions/v1/add-tester',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_cnirUBhoUJz3L7I9VpK-nQ_R3zmBpGn',
        'x-gate', 'm4ch11_addtester_gate_7f3a9c2e1b'
      ),
      body := jsonb_build_object('email', new.email)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_waitlist_add_tester on public.waitlist;
create trigger trg_waitlist_add_tester
  after insert on public.waitlist
  for each row execute function public.on_waitlist_android_add_tester();
