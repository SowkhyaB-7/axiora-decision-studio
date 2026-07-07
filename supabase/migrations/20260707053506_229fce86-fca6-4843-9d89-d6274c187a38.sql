
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by owner" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- decision_boards
CREATE TABLE public.decision_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decision_boards TO authenticated;
GRANT ALL ON public.decision_boards TO service_role;
ALTER TABLE public.decision_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages boards" ON public.decision_boards FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX idx_decision_boards_owner ON public.decision_boards(owner_id);

-- assessment_dimensions
CREATE TABLE public.assessment_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.decision_boards(id) ON DELETE CASCADE,
  dimension_name TEXT NOT NULL,
  readiness_score NUMERIC,
  readiness_level TEXT,
  blocking_condition_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_dimensions TO authenticated;
GRANT ALL ON public.assessment_dimensions TO service_role;
ALTER TABLE public.assessment_dimensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Board owner manages dimensions" ON public.assessment_dimensions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decision_boards b WHERE b.id = board_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.decision_boards b WHERE b.id = board_id AND b.owner_id = auth.uid()));
CREATE INDEX idx_dimensions_board ON public.assessment_dimensions(board_id);

-- evidence
CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id UUID NOT NULL REFERENCES public.assessment_dimensions(id) ON DELETE CASCADE,
  evidence_type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  evidence_strength TEXT,
  recency TEXT,
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence TO authenticated;
GRANT ALL ON public.evidence TO service_role;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Board owner manages evidence" ON public.evidence FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessment_dimensions d
    JOIN public.decision_boards b ON b.id = d.board_id
    WHERE d.id = dimension_id AND b.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assessment_dimensions d
    JOIN public.decision_boards b ON b.id = d.board_id
    WHERE d.id = dimension_id AND b.owner_id = auth.uid()
  ));
CREATE INDEX idx_evidence_dimension ON public.evidence(dimension_id);

-- ai_analyses
CREATE TABLE public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.decision_boards(id) ON DELETE CASCADE,
  overall_readiness NUMERIC,
  recommendation TEXT,
  decision_brief TEXT,
  dimension_results JSONB,
  analysis_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_analyses TO authenticated;
GRANT ALL ON public.ai_analyses TO service_role;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Board owner manages ai analyses" ON public.ai_analyses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decision_boards b WHERE b.id = board_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.decision_boards b WHERE b.id = board_id AND b.owner_id = auth.uid()));
CREATE INDEX idx_ai_analyses_board ON public.ai_analyses(board_id);

-- final_decisions
CREATE TABLE public.final_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.decision_boards(id) ON DELETE CASCADE,
  user_decision TEXT,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.final_decisions TO authenticated;
GRANT ALL ON public.final_decisions TO service_role;
ALTER TABLE public.final_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Board owner manages final decisions" ON public.final_decisions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decision_boards b WHERE b.id = board_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.decision_boards b WHERE b.id = board_id AND b.owner_id = auth.uid()));
CREATE INDEX idx_final_decisions_board ON public.final_decisions(board_id);

-- updated_at trigger for decision_boards
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_decision_boards_updated_at
BEFORE UPDATE ON public.decision_boards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto-create profile on new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
