-- ============================================================================
-- Machii — Bucket Storage 'vehicle-photos' (#12-A, photo du véhicule)
--
-- Chaque conducteur upload dans son dossier `{user_id}/vehicle.jpg`.
-- Lecture publique, écriture/suppression restreintes au propriétaire.
--
-- NOTE sécurité : le bucket est public (comme avatars). L'app ne SURFACE
-- l'URL de la photo qu'aux passagers acceptés (via get_trip_vehicle, qui ne
-- renvoie `photo_url` que si `revealed`). Durcissement possible plus tard :
-- bucket privé + URL signée à la révélation. La plaque (vecteur de fraude)
-- reste, elle, du texte protégé côté serveur.
--
-- Idempotent.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-photos',
  'vehicle-photos',
  true,
  3 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vehicle-photos read public" on storage.objects;
create policy "vehicle-photos read public" on storage.objects for select
  using (bucket_id = 'vehicle-photos');

drop policy if exists "vehicle-photos owner insert" on storage.objects;
create policy "vehicle-photos owner insert" on storage.objects for insert
  with check (
    bucket_id = 'vehicle-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "vehicle-photos owner update" on storage.objects;
create policy "vehicle-photos owner update" on storage.objects for update
  using (
    bucket_id = 'vehicle-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'vehicle-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "vehicle-photos owner delete" on storage.objects;
create policy "vehicle-photos owner delete" on storage.objects for delete
  using (
    bucket_id = 'vehicle-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
