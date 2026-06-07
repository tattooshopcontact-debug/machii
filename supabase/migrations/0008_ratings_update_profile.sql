-- ============================================================================
-- Machii — Mise à jour automatique de profiles.rating_avg via les ratings
--
-- Quand un rating est inséré, on recalcule la moyenne de toutes les notes
-- (4 critères * 1-5) pour le `ratee_id` et on update profiles.rating_avg.
-- ============================================================================

create or replace function public.recalc_profile_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_avg numeric(2,1);
begin
  select round(
    avg((coalesce(punctuality, 0) + coalesce(cleanliness, 0) + coalesce(driving, 0) + coalesce(friendliness, 0))::numeric
        / nullif(
            (case when punctuality is not null then 1 else 0 end +
             case when cleanliness is not null then 1 else 0 end +
             case when driving is not null then 1 else 0 end +
             case when friendliness is not null then 1 else 0 end), 0)
       ), 1)
    into v_avg
  from public.ratings
  where ratee_id = new.ratee_id;

  update public.profiles
    set rating_avg = coalesce(v_avg, 0)
  where id = new.ratee_id;

  return new;
end;
$$;

drop trigger if exists on_rating_inserted on public.ratings;
create trigger on_rating_inserted
  after insert on public.ratings
  for each row execute function public.recalc_profile_rating();
