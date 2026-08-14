import type { Verdict, Confidence } from "@/lib/verdict";

export type BriefingClaim = {
  /** One short, evidence-grounded sentence. */
  claim: string;
  /** Real evidence reference numbers (Evidence #N) backing the claim. */
  evidence_refs: number[];
};

export type Briefing = {
  /** Short paragraph explaining the current state, grounded in evidence. */
  why: string;
  supports: BriefingClaim[];
  contradicts: BriefingClaim[];
  /** Only set when evidence disagrees: the open question to resolve. */
  unresolved: string | null;
  /** Specific evidence gaps stated as things to confirm. */
  missing: string[];
  next_action: string;
  /** false when the text came from Axiora's own deterministic copy. */
  ai_generated: boolean;
};

export type BriefingContext = {
  verdict: Verdict;
  confidence: Confidence;
};
