-- =============================================================================
-- SM Delights — 04_storage.sql
-- Run FOURTH. Creates the public "product-images" bucket that the admin panel
-- uploads product photos and review screenshots into.
-- Anyone can VIEW the images (they're on the public shop); only admins can upload,
-- replace or delete them. Safe to re-run.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true,
  5242880, -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists smd_images_admin_insert on storage.objects;
drop policy if exists smd_images_admin_update on storage.objects;
drop policy if exists smd_images_admin_delete on storage.objects;

create policy smd_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy smd_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy smd_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
