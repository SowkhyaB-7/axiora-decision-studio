ALTER TABLE public.work_items
  DROP CONSTRAINT work_items_status_check;

ALTER TABLE public.work_items
  ADD CONSTRAINT work_items_status_check
  CHECK (status IN ('UNSCHEDULED','NOW','NEXT','LATER','BLOCKED','COMPLETED'));

COMMENT ON COLUMN public.work_items.status IS 'Workspace state. UNSCHEDULED is neutral and carries no implied timing.';