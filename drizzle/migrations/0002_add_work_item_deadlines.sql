ALTER TABLE public.work_items
  ADD COLUMN due_date date,
  ADD COLUMN due_at timestamptz,
  ADD COLUMN deadline_source text CHECK (deadline_source IN ('GOAL','USER')),
  ADD COLUMN deadline_checked boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.work_items.due_date IS 'Local calendar date of the deadline (source of truth for date-only deadlines).';
COMMENT ON COLUMN public.work_items.due_at IS 'Exact instant, only when the user specified a time.';