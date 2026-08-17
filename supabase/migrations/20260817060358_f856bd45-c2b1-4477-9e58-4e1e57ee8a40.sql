ALTER TABLE public.evidence_items
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'PASTED_TEXT',
  ADD COLUMN IF NOT EXISTS source_filename text,
  ADD COLUMN IF NOT EXISTS source_file_type text,
  ADD COLUMN IF NOT EXISTS source_storage_path text;

CREATE OR REPLACE FUNCTION public.enforce_future_decide_by()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.decide_by IS NOT NULL AND NOT NEW.is_demo AND NEW.decide_by < CURRENT_DATE THEN
    RAISE EXCEPTION 'Choose today or a future date.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_future_decide_by_trigger ON public.decisions;
CREATE TRIGGER enforce_future_decide_by_trigger
BEFORE INSERT ON public.decisions
FOR EACH ROW EXECUTE FUNCTION public.enforce_future_decide_by();

-- Storage policies so owners can upload/read their own evidence documents
DROP POLICY IF EXISTS "Owner uploads evidence documents" ON storage.objects;
CREATE POLICY "Owner uploads evidence documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'evidence-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owner reads evidence documents" ON storage.objects;
CREATE POLICY "Owner reads evidence documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'evidence-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Owner deletes evidence documents" ON storage.objects;
CREATE POLICY "Owner deletes evidence documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'evidence-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);