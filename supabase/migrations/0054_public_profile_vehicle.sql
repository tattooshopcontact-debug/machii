-- Étend get_public_profile pour exposer le VÉHICULE du conducteur (marque /
-- modèle / couleur / places / photo) dans le profil public façon Airbnb.
-- La PLAQUE n'est JAMAIS exposée (comme pour get_trip_vehicle).
-- Changement RÉTRO-COMPATIBLE : on ajoute seulement une clé "vehicle" au JSON ;
-- tous les champs existants restent identiques, donc l'app/site actuels ne
-- cassent pas (ils ignorent la nouvelle clé jusqu'à leur mise à jour).
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
        'seats', v.seats,
        'photo_url', v.photo_url
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
