
ALTER TABLE public.ai_analyses ADD COLUMN IF NOT EXISTS confidence_score integer;
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS update_evidence_updated_at ON public.evidence;
CREATE TRIGGER update_evidence_updated_at
BEFORE UPDATE ON public.evidence
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
