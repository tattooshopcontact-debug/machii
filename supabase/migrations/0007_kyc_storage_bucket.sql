-- ============================================================================
-- Machii — KYC documents (Supabase Storage)
--
-- Bucket 'kyc' PRIVÉ (pas de lecture publique). Layout :
--   {user_id}/cin.jpg / permis.jpg / carte_grise.jpg / photo_vehicule.jpg
--
-- L'utilisateur peut uploader/voir ses propres docs.
-- Un futur "admin" sera ajouté via une policy séparée (non gérée en V0,
-- la modération sera manuelle côté dashboard Supabase).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kyc',
  'kyc',
  false,
  10 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "kyc owner select" on storage.objects;
create policy "kyc owner select" on storage.objects for select
  using (
    bucket_id = 'kyc'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "kyc owner insert" on storage.objects;
create policy "kyc owner insert" on storage.objects for insert
  with check (
    bucket_id = 'kyc'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "kyc owner update" on storage.objects;
create policy "kyc owner update" on storage.objects for update
  using (
    bucket_id = 'kyc'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'kyc'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "kyc owner delete" on storage.objects;
create policy "kyc owner delete" on storage.objects for delete
  using (
    bucket_id = 'kyc'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
