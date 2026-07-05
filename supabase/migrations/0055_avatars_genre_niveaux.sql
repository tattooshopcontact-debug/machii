-- ============================================================================
-- Machii — Avatars par genre + échelle 10 niveaux + verrou de déblocage
-- (programme avatars validé par Faouez 2026-07-05)
--
-- 1. avatar_key : ouvre les clés FEMMES (5 existantes + 6 nouvelles) — la
--    contrainte historique ne connaissait que les 8 clés hommes.
-- 2. Échelle de niveaux étendue à 10 (Ambassadeur niv.8 / Légende niv.10
--    étaient INATTEIGNABLES : l'échelle s'arrêtait à 5).
-- 3. Verrou serveur anti-triche : un avatar ne peut être choisi que si son
--    palier est réellement débloqué (mêmes règles que le catalogue de l'app).
--    Genre : un homme ne peut pas prendre un avatar femme. (L'inverse est
--    toléré pendant la transition — l'app testeurs ne propose que les clés
--    hommes — et sera resserré à la version finale.)
-- L'avatar « Vérifié(e) » reste lié au badge ✓ (décision Faouez : récompense
-- de crédibilité). Idempotent.
-- ============================================================================

-- 1. Clés d'avatars : hommes (8) + femmes (11 : 5 existantes + 6 nouvelles) --------
alter table public.profiles drop constraint if exists profiles_avatar_key_check;
alter table public.profiles add constraint profiles_avatar_key_check check (
  avatar_key is null or avatar_key in (
    -- hommes
    'voyageur','regulier','conducteur','verifie','confiance','veteran','ambassadeur','legende',
    -- femmes (voilées et cheveux visibles)
    'voyageuse','reguliere','reguliere_cheveux','conductrice','conductrice_cheveux',
    'verifiee','confiante','confiante_cheveux','veterane','ambassadrice','legende_f'
  )
);

-- 2. Échelle 10 niveaux -------------------------------------------------------------
-- L1 0 · L2 100 · L3 300 · L4 600 · L5 1000 · L6 1500 · L7 2100 · L8 2800 · L9 3600 · L10 4500
create or replace function public._level_for_xp(p_xp int)
returns int language sql immutable as $$
  select case
    when p_xp >= 4500 then 10
    when p_xp >= 3600 then 9
    when p_xp >= 2800 then 8
    when p_xp >= 2100 then 7
    when p_xp >= 1500 then 6
    when p_xp >= 1000 then 5
    when p_xp >= 600  then 4
    when p_xp >= 300  then 3
    when p_xp >= 100  then 2
    else 1
  end;
$$;
-- Recale les niveaux existants sur la nouvelle échelle.
update public.profiles set level = public._level_for_xp(coalesce(xp, 0))
 where level is distinct from public._level_for_xp(coalesce(xp, 0));

-- 3. Verrou de déblocage ---------------------------------------------------------------
-- Trajets "vécus" = trajets conduits terminés + réservations passager terminées.
create or replace function public._completed_trips_count(p_user uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select count(*) from trips where driver_id = p_user and status = 'done'), 0)::int
       + coalesce((select count(*) from bookings where passenger_id = p_user and status = 'completed'), 0)::int;
$$;

create or replace function public._avatar_unlocked(p_key text, p_user public.profiles)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_trips int := public._completed_trips_count(p_user.id);
  v_level int := coalesce(p_user.level, 1);
  v_rating numeric := coalesce(p_user.rating_avg, 0);
begin
  return case
    when p_key in ('voyageur','voyageuse') then true
    when p_key in ('regulier','reguliere','reguliere_cheveux') then v_level >= 2 or v_trips >= 3
    when p_key in ('conducteur','conductrice','conductrice_cheveux')
      then p_user.role::text in ('driver','both') and (v_level >= 2 or v_trips >= 3)
    when p_key in ('verifie','verifiee') then coalesce(p_user.is_verified, false)
    when p_key in ('confiance','confiante','confiante_cheveux') then v_rating >= 4 and v_trips >= 5
    when p_key in ('veteran','veterane') then v_trips >= 50
    when p_key in ('ambassadeur','ambassadrice') then v_level >= 8
    when p_key in ('legende','legende_f') then v_level >= 10 and v_rating >= 4.8
    else false
  end;
end;
$$;

-- Trigger : choix d'avatar contrôlé (palier débloqué + pas d'avatar femme pour un homme).
create or replace function public.guard_avatar_choice()
returns trigger language plpgsql set search_path = public as $$
declare
  v_female_keys text[] := array['voyageuse','reguliere','reguliere_cheveux','conductrice',
    'conductrice_cheveux','verifiee','confiante','confiante_cheveux','veterane','ambassadrice','legende_f'];
begin
  if new.avatar_key is distinct from old.avatar_key and new.avatar_key is not null then
    -- contexte privilégié (admin/serveur) : laissé passer
    if current_user in ('postgres', 'supabase_admin', 'service_role')
       or coalesce((select is_admin from profiles where id = auth.uid()), false) then
      return new;
    end if;
    if new.gender = 'male' and new.avatar_key = any(v_female_keys) then
      raise exception 'avatar_wrong_gender';
    end if;
    if not public._avatar_unlocked(new.avatar_key, new) then
      raise exception 'avatar_locked';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_guard_avatar_choice on public.profiles;
create trigger trg_guard_avatar_choice
  before update on public.profiles
  for each row execute function public.guard_avatar_choice();
