ALTER TABLE public.work_items ADD COLUMN IF NOT EXISTS completed_at timestamptz;
UPDATE public.work_items SET completed_at = updated_at WHERE status = 'COMPLETED' AND completed_at IS NULL;

CREATE TABLE public.work_item_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id uuid NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  filename text NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  extracted_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_item_attachments TO authenticated;
GRANT ALL ON public.work_item_attachments TO service_role;
ALTER TABLE public.work_item_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages work item attachments" ON public.work_item_attachments
FOR ALL TO authenticated
USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.work_items w WHERE w.id = work_item_id AND w.owner_id = auth.uid()))
WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.work_items w WHERE w.id = work_item_id AND w.owner_id = auth.uid()));
CREATE INDEX work_item_attachments_item_idx ON public.work_item_attachments(work_item_id);