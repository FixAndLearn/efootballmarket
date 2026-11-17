-- The listing-images bucket stores objects FLAT at the bucket root
-- (e.g. squad_<ts>_<hex>_<name>.jpg), so storage.foldername(name)[1] is NULL and a
-- folder-scoped owner policy can never match. Uploads run through the service role in
-- /api/upload, so takedown must also be service-role only. These two policies were
-- added and then removed the same day; this file records that outcome for the repo.
DROP POLICY IF EXISTS "Owner can update own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Owner can delete own listing images" ON storage.objects;
