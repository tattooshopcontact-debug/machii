-- Machii — Mode Défi / Classement hebdomadaire (développé mais CACHÉ).
-- Gated par le feature flag `challenge` (OFF au départ). Score = CO₂ évité.

-- Flag caché (num 12, après auto_verify=11)
insert into public.feature_flags(key, num, label, version, enabled)
values ('challenge', 12, 'Défi / classement hebdomadaire', '1.2.0', false)
on conflict (key) do nothing;

-- RPC classement : conducteurs (trajets réels de la semaine) OU équipages (impact).
create or replace function public.get_leaderboard(p_kind text default 'drivers', p_city text default null)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $fn$
declare v jsonb;
begin
  if p_kind = 'crews' then
    select coalesce(jsonb_agg(to_jsonb(x) order by x.score desc), '[]'::jsonb) into v from (
      select c.id, c.name, c.origin_label, c.destination_label,
        (select count(*) from public.crew_members m where m.crew_id = c.id and m.active)::int as members,
        round(greatest(0, (select count(*) from public.crew_members m where m.crew_id = c.id and m.active) - 1)
              * c.distance_km * 2 * coalesce(array_length(c.days, 1), 0) * 0.12)::int as score
      from public.crews c
      where (p_city is null or c.origin_label = p_city or c.destination_label = p_city)
      order by score desc limit 20
    ) x;
  else
    select coalesce(jsonb_agg(to_jsonb(x) order by x.score desc), '[]'::jsonb) into v from (
      select p.id, p.full_name as name, p.avatar_key, p.avatar_url,
        count(t.id)::int as trips,
        round(coalesce(sum(ST_Distance(t.origin, t.destination) / 1000.0
              * greatest(0, t.seats_total - t.seats_available) * 0.12), 0))::int as score
      from public.trips t
      join public.profiles p on p.id = t.driver_id
      where t.departure_time >= date_trunc('week', now())
        and t.departure_time <  date_trunc('week', now()) + interval '7 days'
        and t.origin is not null and t.destination is not null
        and (p_city is null or t.origin_label = p_city or t.destination_label = p_city)
      group by p.id, p.full_name, p.avatar_key, p.avatar_url
      order by score desc limit 20
    ) x;
  end if;
  return v;
end; $fn$;

grant execute on function public.get_leaderboard(text, text) to authenticated, anon;
