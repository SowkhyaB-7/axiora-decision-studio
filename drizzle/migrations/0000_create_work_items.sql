CREATE TABLE public.work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_goal text NOT NULL,
  title text NOT NULL,
  description text,
  workstream text NOT NULL DEFAULT 'General',
  status text NOT NULL DEFAULT 'NEXT',
  mode text NOT NULL DEFAULT 'SIMPLE',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_action text,
  blocked_by uuid REFERENCES public.work_items(id) ON DELETE SET NULL,
  blocker_label text,
  blocker_confirmed boolean,
  clarifying_question text,
  clarifying_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  clarifying_answer text,
  ai_reasoning text,
  user_corrections jsonb NOT NULL DEFAULT '[]'::jsonb,
  decision_id uuid REFERENCES public.decisions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_items_status_check CHECK (status IN ('NOW','NEXT','LATER','BLOCKED','COMPLETED')),
  CONSTRAINT work_items_mode_check CHECK (mode IN ('SIMPLE','AMBIGUOUS','DEPENDENCY','DECISION'))
);

CREATE INDEX work_items_owner_idx ON public.work_items (owner_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_items TO authenticated;
GRANT ALL ON public.work_items TO service_role;

ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages work items"
ON public.work_items
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER update_work_items_updated_at
BEFORE UPDATE ON public.work_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();