-- Profil public d'un membre pour le pop-up « profil conducteur » (site + app).
-- RLS interdit le SELECT direct sur profiles à anon (anti-énumération PII). Cette
-- RPC SECURITY DEFINER expose UNIQUEMENT les colonnes publiques (jamais le
-- téléphone) + les compteurs trajets/avis, accessible anon + authenticated.
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
    'rating_count', (select count(*) from public.ratings r where r.ratee_id = p.id)
  )
  from public.profiles p
  where p.id = p_user_id;
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;
