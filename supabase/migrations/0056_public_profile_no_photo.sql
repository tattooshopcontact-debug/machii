-- Corrige get_public_profile : la PHOTO du véhicule ne doit PAS être publique.
-- Le profil public garde marque/modèle/couleur/places (infos générales), mais
-- la PHOTO (comme la plaque) reste réservée au contexte trajet : elle est
-- révélée uniquement au conducteur et aux passagers acceptés via
-- get_trip_vehicle (écran détail/confirmation de trajet).
-- Rétro-compatible : on retire seulement la clé photo_url du sous-objet vehicle.
create or replace function public.get_public_profile(p_user_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'is_verified', p.is_verified,
    'rating_avg', p.rating_avg,
    'level', p.level,
    'bio', p.bio,
    'city', p.city,
    'pref_smoking', p.pref_smoking,
    'pref_music', p.pref_music,
    'pref_pets', p.pref_pets,
    'pref_chat', p.pref_chat,
    'avatar_key', p.avatar_key,
    'avatar_url', p.avatar_url,
    'created_at', p.created_at,
    'trip_count', (select count(*) from public.trips t where t.driver_id = p.id),
    'rating_count', (select count(*) from public.ratings r where r.ratee_id = p.id),
    'vehicle', (
      select json_build_object(
        'make', v.make,
        'model', v.model,
        'color', v.color,
        'seats', v.seats
      )
      from public.vehicles v
      where v.driver_id = p.id
      order by v.created_at desc
      limit 1
    )
  )
  from public.profiles p
  where p.id = p_user_id;
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;
