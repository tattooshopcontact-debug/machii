-- Ajoute genre + rôle au profil public (0045) : nécessaires pour afficher le
-- TITRE d'expérience correctement accordé (« Vétérane » vs « Vétéran ») quand
-- le membre utilise sa vraie photo (règle Faouez 2026-07-05). Le genre est déjà
-- une donnée publique de fait (badges « entre femmes », grant anon 0020).
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
    'gender', p.gender,
    'role', p.role,
    'pref_smoking', p.pref_smoking,
    'pref_music', p.pref_music,
    'pref_pets', p.pref_pets,
    'pref_chat', p.pref_chat,
    'avatar_key', p.avatar_key,
    'avatar_url', p.avatar_url,
    'created_at', p.created_at,
    'trip_count', (select count(*) from public.trips t where t.driver_id = p.id),
    'rating_count', (select count(*) from public.ratings r where r.ratee_id = p.id)
  )
  from public.profiles p
  where p.id = p_user_id;
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;
