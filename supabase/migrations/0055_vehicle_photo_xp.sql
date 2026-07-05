-- ============================================================================
-- Machii — Photo de véhicule OPTIONNELLE qui récompense de l'XP (crédibilité).
-- +15 XP, UNE SEULE FOIS, quand un conducteur ajoute une photo à son véhicule.
-- Même mécanisme que les autres gains d'XP (triggers + add_xp), donc
-- server-authoritative (impossible à tricher côté client).
-- Idempotent.
-- ============================================================================

-- Drapeau anti-farm : on ne récompense la photo qu'une fois par véhicule
-- (sinon retirer/remettre la photo donnerait de l'XP en boucle).
alter table public.vehicles
  add column if not exists photo_xp_awarded boolean not null default false;

create or replace function public._xp_on_vehicle_photo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.photo_url is not null
     and length(btrim(new.photo_url)) > 0
     and not coalesce(new.photo_xp_awarded, false) then
    perform public.add_xp(new.driver_id, 15);
    new.photo_xp_awarded := true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_xp_on_vehicle_photo on public.vehicles;
create trigger trg_xp_on_vehicle_photo
  before insert or update on public.vehicles
  for each row execute function public._xp_on_vehicle_photo();

-- Backfill : les conducteurs qui ont DÉJÀ une photo reçoivent l'XP une fois
-- (table vide aujourd'hui, donc no-op en pratique, mais correct si données).
do $$
declare r record;
begin
  for r in
    select id, driver_id from public.vehicles
    where photo_url is not null and length(btrim(photo_url)) > 0 and not photo_xp_awarded
  loop
    perform public.add_xp(r.driver_id, 15);
    update public.vehicles set photo_xp_awarded = true where id = r.id;
  end loop;
end $$;
