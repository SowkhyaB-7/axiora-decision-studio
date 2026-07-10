
ALTER TABLE public.evidence
  ADD COLUMN IF NOT EXISTS evidence_date date,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS attachment_path text;
