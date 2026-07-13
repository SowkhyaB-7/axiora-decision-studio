
ALTER TABLE public.decision_boards
  ADD COLUMN IF NOT EXISTS analysis_status text NOT NULL DEFAULT 'Not Analyzed';

ALTER TABLE public.evidence
  ADD COLUMN IF NOT EXISTS attachment_paths text[] NOT NULL DEFAULT '{}';

-- Backfill array from legacy single attachment_path where present
UPDATE public.evidence
   SET attachment_paths = ARRAY[attachment_path]
 WHERE attachment_path IS NOT NULL
   AND (attachment_paths IS NULL OR array_length(attachment_paths, 1) IS NULL);

-- Backfill analysis_status for boards that already have an analysis
UPDATE public.decision_boards b
   SET analysis_status = 'Analysis Complete'
  FROM public.ai_analyses a
 WHERE a.board_id = b.id
   AND b.analysis_status = 'Not Analyzed';
