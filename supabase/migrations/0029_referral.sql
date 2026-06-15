-- ============================================================================
-- Machii — Parrainage (#15 / #17). Chaque user a un code à partager. Un nouveau
-- venu saisit le code de son parrain → le parrain gagne +20 XP, le filleul +10
-- (bonus de bienvenue). Une seule fois par filleul.
--
-- Idempotent.
-- ============================================================================

alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by  uuid references public.profiles(id);

-- Génère un code lisible de 6 caractères (sans 0/O/1/I pour éviter la confusion).
create or replace function public._gen_referral_code()
returns text language plpgsql as $$
declare
  v_alpha text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code  text;
  i       int;
begin
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_alpha, floor(random() * length(v_alpha))::int + 1, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = v_code);
  end loop;
  return v_code;
end;
$$;

-- Trigger : attribue un code à la création si absent.
create or replace function public._set_referral_code()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.referral_code is null or new.referral_code = '' then
    new.referral_code := public._gen_referral_code();
  end if;
  return new;
end;
$$;
drop trigger if exists trg_set_referral_code on public.profiles;
create trigger trg_set_referral_code
  before insert on public.profiles
  for each row execute function public._set_referral_code();

-- Backfill des comptes existants (codes uniques).
do $$
declare r record;
begin
  for r in select id from public.profiles where referral_code is null loop
    update public.profiles set referral_code = public._gen_referral_code() where id = r.id;
  end loop;
end $$;

alter table public.profiles alter column referral_code set not null;
create unique index if not exists profiles_referral_code_uidx on public.profiles (referral_code);

-- Le code parrain est lisible (col déjà couverte par les grants profiles).
grant select (referral_code, referred_by) on public.profiles to authenticated;

-- RPC : le filleul (user courant) applique le code de son parrain.
create or replace function public.apply_referral(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_ref uuid;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'not_auth'); end if;
  if (select referred_by from public.profiles where id = v_uid) is not null then
    return jsonb_build_object('ok', false, 'reason', 'already');
  end if;
  select id into v_ref from public.profiles where upper(referral_code) = upper(trim(coalesce(p_code, '')));
  if v_ref is null then return jsonb_build_object('ok', false, 'reason', 'bad_code'); end if;
  if v_ref = v_uid then return jsonb_build_object('ok', false, 'reason', 'self'); end if;

  update public.profiles set referred_by = v_ref where id = v_uid;
  perform public.add_xp(v_ref, 20);  -- parrain
  perform public.add_xp(v_uid, 10);  -- filleul (bienvenue)
  return jsonb_build_object('ok', true);
end;
$$;
grant execute on function public.apply_referral(text) to authenticated;

-- Compte mes filleuls (pour l'écran parrainage).
create or replace function public.my_referral_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles where referred_by = auth.uid();
$$;
grant execute on function public.my_referral_count() to authenticated;

-- Flag F9 (OFF).
insert into public.feature_flags (key, num, label, version, enabled) values
  ('referral', 9, 'Parrainage (+20 XP)', 'v1.2.0', false)
on conflict (key) do update set num = excluded.num, label = excluded.label, version = excluded.version;
