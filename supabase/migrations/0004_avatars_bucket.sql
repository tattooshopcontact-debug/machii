-- ============================================================================
-- Machii — Bucket Storage 'avatars'
--
-- Crée le bucket public 'avatars' pour les photos de profil.
-- Chaque user upload dans son propre dossier `{user_id}/avatar.jpg`.
-- Lecture publique, écriture/suppression restreintes au propriétaire.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Policy : tout le monde peut LIRE les avatars (le bucket est public mais la
-- policy est plus permissive et plus explicite côté audit).
drop policy if exists "avatars read public" on storage.objects;
create policy "avatars read public" on storage.objects for select
  using (bucket_id = 'avatars');

-- Policy : un user authentifié ne peut INSÉRER que dans son propre dossier
-- `{auth.uid()}/...`
drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert" on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy : un user ne peut UPDATE / DELETE QUE les fichiers de son dossier.
drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
