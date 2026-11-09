-- Files are shared through long-lived signed links made at upload time, so direct reads are limited to uploaders and staff.
DROP POLICY IF EXISTS "service images public read" ON storage.objects;
CREATE POLICY "service images staff read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'service-images' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "programme files read" ON storage.objects;
CREATE POLICY "programme files owner or admin read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'programme-files' AND (
  public.has_role(auth.uid(), 'super_admin')
  OR ((storage.foldername(name))[1] = 'contributions' AND (storage.foldername(name))[2] = auth.uid()::text)
));

DROP POLICY IF EXISTS "avatars read" ON storage.objects;
CREATE POLICY "avatars owner or staff read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())));