-- Axiora V2 schema
CREATE TABLE public.decisions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  context text,
  decide_by date,
  status text NOT NULL DEFAULT 'OPEN',
  decided_at timestamptz,
  final_choice text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decisions TO authenticated;
GRANT ALL ON public.decisions TO service_role;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages decisions" ON public.decisions FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON public.decisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.evidence_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id uuid NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  ref integer NOT NULL DEFAULT 1,
  raw_text text NOT NULL,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('CUSTOMER','TECHNICAL','BUSINESS')),
  direction text NOT NULL CHECK (direction IN ('SUPPORTS','CONTRADICTS','NEUTRAL')),
  strength text NOT NULL CHECK (strength IN ('WEAK','MODERATE','STRONG')),
  takeaway text,
  extraction_source text NOT NULL DEFAULT 'AI',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX evidence_items_decision_idx ON public.evidence_items(decision_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_items TO authenticated;
GRANT ALL ON public.evidence_items TO service_role;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages evidence items" ON public.evidence_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decisions d WHERE d.id = evidence_items.decision_id AND d.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.decisions d WHERE d.id = evidence_items.decision_id AND d.owner_id = auth.uid()));
CREATE TRIGGER update_evidence_items_updated_at BEFORE UPDATE ON public.evidence_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- per-decision human reference number (Evidence #1, #2, ...)
CREATE OR REPLACE FUNCTION public.set_evidence_ref()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  SELECT COALESCE(MAX(ref), 0) + 1 INTO NEW.ref
  FROM public.evidence_items WHERE decision_id = NEW.decision_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_evidence_ref_trigger BEFORE INSERT ON public.evidence_items
  FOR EACH ROW EXECUTE FUNCTION public.set_evidence_ref();

CREATE TABLE public.decision_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id uuid NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  original_verdict text NOT NULL,
  override_choice text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decision_overrides TO authenticated;
GRANT ALL ON public.decision_overrides TO service_role;
ALTER TABLE public.decision_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages overrides" ON public.decision_overrides FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decisions d WHERE d.id = decision_overrides.decision_id AND d.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.decisions d WHERE d.id = decision_overrides.decision_id AND d.owner_id = auth.uid()));

CREATE TABLE public.decision_outcomes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id uuid NOT NULL UNIQUE REFERENCES public.decisions(id) ON DELETE CASCADE,
  outcome text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decision_outcomes TO authenticated;
GRANT ALL ON public.decision_outcomes TO service_role;
ALTER TABLE public.decision_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages outcomes" ON public.decision_outcomes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decisions d WHERE d.id = decision_outcomes.decision_id AND d.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.decisions d WHERE d.id = decision_outcomes.decision_id AND d.owner_id = auth.uid()));
CREATE TRIGGER update_decision_outcomes_updated_at BEFORE UPDATE ON public.decision_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- cached AI briefing, keyed by a fingerprint of the current evidence set
CREATE TABLE public.decision_briefings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id uuid NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  fingerprint text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (decision_id, fingerprint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decision_briefings TO authenticated;
GRANT ALL ON public.decision_briefings TO service_role;
ALTER TABLE public.decision_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages briefings" ON public.decision_briefings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.decisions d WHERE d.id = decision_briefings.decision_id AND d.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.decisions d WHERE d.id = decision_briefings.decision_id AND d.owner_id = auth.uid()));

-- seeded demo decision for every user (existing and future)
CREATE OR REPLACE FUNCTION public.seed_demo_decision(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.decisions WHERE owner_id = _user_id AND is_demo) THEN
    RETURN;
  END IF;

  INSERT INTO public.decisions (owner_id, title, context, decide_by, is_demo)
  VALUES (
    _user_id,
    'Should we launch the AI Copilot to enterprise customers?',
    'We have Copilot working for self-serve accounts. Two enterprise logos are pushing for access this quarter, and the exec team wants a go/no-go before the board meeting.',
    (CURRENT_DATE + 21),
    true
  ) RETURNING id INTO d_id;

  INSERT INTO public.evidence_items (decision_id, raw_text, title, category, direction, strength, takeaway, extraction_source)
  VALUES
  (d_id,
   'Interview notes, Northwind (VP Ops) + 3 other enterprise prospects. Verbatim: "we cannot roll this out to 400 people without SSO, that is a hard security review blocker." Two of the four also asked about audit logs but were less firm. All four said the copilot itself solved a real workflow problem for them.',
   'Enterprise prospects want Copilot but require SSO first',
   'CUSTOMER','SUPPORTS','STRONG',
   '3 of 4 enterprise prospects named SSO as a purchase requirement, and all 4 confirmed the underlying workflow value.','AI'),
  (d_id,
   'Sales sync, Aug: two committed enterprise deals ($140k ARR combined) list Copilot as a deciding factor. Pipeline has 5 more accounts asking. No pricing objections so far, though we have not tested the enterprise price point formally.',
   'Two enterprise deals name Copilot as a deciding factor',
   'BUSINESS','SUPPORTS','MODERATE',
   'Roughly $140k ARR is attached to Copilot availability, but enterprise pricing is untested.','AI'),
  (d_id,
   'Eng estimate from Priya: SSO (SAML + SCIM) is realistically 6 weeks with one engineer, maybe 4 if we cut SCIM. Current launch target is 3 weeks out. Rushing it means a hand-rolled SAML path we would have to maintain, and we are already carrying the billing migration.',
   'SSO delivery is estimated at 6 weeks against a 3-week launch target',
   'TECHNICAL','CONTRADICTS','STRONG',
   'Engineering estimates SSO at ~6 weeks, which does not fit the current launch date without added maintenance risk.','AI'),
  (d_id,
   'Support thread with a mid-market account (not enterprise): they tried Copilot and said "it is fine, we would probably not pay extra for it." Small account, single user, low usage.',
   'One mid-market account is indifferent to Copilot',
   'CUSTOMER','NEUTRAL','WEAK',
   'A single low-usage mid-market account showed no willingness to pay, but is not in the target segment.','AI');
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  PERFORM public.seed_demo_decision(NEW.id);
  RETURN NEW;
END;
$$;

DO $$
DECLARE u record;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    PERFORM public.seed_demo_decision(u.id);
  END LOOP;
END $$;