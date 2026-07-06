-- Machii — Fix official_toll : Tunis est l'entrée de PLUSIEURS autoroutes (A1/A3/A4).
-- La station la + proche du départ n'est pas forcément sur l'autoroute de l'arrivée → 0 à tort.
-- Correctif : on teste par GROUPE d'autoroute (A1={1,2}, A3={3}, A4={4}) — départ ET arrivée
--   doivent être proches d'une station DU MÊME groupe. On garde le tarif du groupe qui matche.

create or replace function public._toll_grp(p_o geography, p_d geography, p_hws int[])
returns numeric language plpgsql stable as $$
declare sf record; st record; v numeric; v1 numeric; v2 numeric;
begin
  select id, highway_id, st_distance(geom,p_o) dist into sf
    from public.toll_stations where geom is not null and highway_id = any(p_hws)
    order by geom <-> p_o limit 1;
  select id, highway_id, st_distance(geom,p_d) dist into st
    from public.toll_stations where geom is not null and highway_id = any(p_hws)
    order by geom <-> p_d limit 1;
  if sf.id is null or st.id is null then return 0; end if;
  if sf.dist > 30000 or st.dist > 30000 then return 0; end if;   -- pas près de CE groupe d'autoroute
  if sf.id = st.id then return 0; end if;
  if sf.highway_id = st.highway_id then
    select price into v from public.toll_matrix where from_id=sf.id and to_id=st.id and klass='c1';
    return coalesce(v,0);
  end if;
  -- A1 : Nord (hw1, charnière Hergla=28) ↔ Sud (hw2, charnière Msaken=13)
  if sf.highway_id=1 and st.highway_id=2 then
    select price into v1 from public.toll_matrix where from_id=sf.id and to_id=28 and klass='c1';
    select price into v2 from public.toll_matrix where from_id=13 and to_id=st.id and klass='c1';
    return coalesce(v1,0)+coalesce(v2,0);
  elsif sf.highway_id=2 and st.highway_id=1 then
    select price into v1 from public.toll_matrix where from_id=sf.id and to_id=13 and klass='c1';
    select price into v2 from public.toll_matrix where from_id=28 and to_id=st.id and klass='c1';
    return coalesce(v1,0)+coalesce(v2,0);
  end if;
  return 0;
end $$;

create or replace function public.official_toll(p_o geography, p_d geography)
returns numeric language sql stable as $$
  select greatest(
    public._toll_grp(p_o, p_d, array[1,2]),   -- A1 Nord+Sud
    public._toll_grp(p_o, p_d, array[3]),      -- A3
    public._toll_grp(p_o, p_d, array[4])       -- A4
  );
$$;

grant execute on function public._toll_grp(geography,geography,int[]) to authenticated, anon;
grant execute on function public.official_toll(geography,geography) to authenticated, anon;
