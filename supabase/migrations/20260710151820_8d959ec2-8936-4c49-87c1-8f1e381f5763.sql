
CREATE POLICY "Users manage own evidence attachments read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'evidence-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users manage own evidence attachments insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'evidence-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users manage own evidence attachments update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'evidence-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users manage own evidence attachments delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'evidence-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
