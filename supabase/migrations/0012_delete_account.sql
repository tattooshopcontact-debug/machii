-- ============================================================================
-- Machii — Suppression de compte conforme Google Play (RGPD + loi tn 2004-63)
--
-- L'utilisateur peut effacer son compte et toutes ses donnees depuis l'app.
-- Une seule RPC publique : delete_my_account().
--
-- Strategie :
--   1. Recupere auth.uid() (l'appelant authentifie).
--   2. Supprime les fichiers Storage de cet utilisateur (avatars + kyc).
--   3. DELETE FROM auth.users WHERE id = auth.uid().
--   4. Toutes les FK des tables publiques ont ON DELETE CASCADE, donc
--      profiles, trips, bookings, conversations, messages, push_tokens,
--      emergency_contacts, kyc_documents, ratings, sos_events, vehicles,
--      trip_waypoints sont purges automatiquement.
--
-- Securite :
--   - SECURITY DEFINER : exécutée comme postgres (proprio du schema auth).
--   - Verification auth.uid() : impossible de supprimer un autre user.
--   - Le client appelle ensuite supabase.auth.signOut() cote app.
-- ============================================================================

create or replace function public.delete_my_account()
returns jsonb language plpgsql security definer set search_path = public, auth, storage as $$
declare
  v_user_id uuid;
  v_deleted_storage int := 0;
  v_deleted_user int := 0;
begin
  -- Recupere l'identite de l'appelant.
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  -- Supprime les objets Storage lies a cet user (avatars + kyc).
  -- Les avatars sont nommes <user_id>/* dans le bucket 'avatars'.
  -- Les KYC sont nommes <user_id>/* dans le bucket 'kyc'.
  begin
    delete from storage.objects
    where bucket_id in ('avatars', 'kyc')
      and (storage.foldername(name))[1] = v_user_id::text;
    get diagnostics v_deleted_storage = row_count;
  exception when others then
    -- Si pas de droit sur storage.objects, on ignore : pas bloquant pour la
    -- suppression du compte (les fichiers oprhelins peuvent etre purges
    -- ulterieurement par une cron Supabase).
    v_deleted_storage := -1;
  end;

  -- Supprime le user dans auth.users (cascade vers toutes les tables public.*).
  delete from auth.users where id = v_user_id;
  get diagnostics v_deleted_user = row_count;

  return jsonb_build_object(
    'ok', true,
    'deleted_user', v_deleted_user,
    'deleted_storage_objects', v_deleted_storage
  );
end;
$$;

-- Seuls les utilisateurs authentifies peuvent l'appeler (et seulement sur eux-memes).
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
