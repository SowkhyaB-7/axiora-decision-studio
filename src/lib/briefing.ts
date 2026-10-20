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
  /**
   * true when generated from the decision's own context with zero evidence
   * records. Exploratory framing, never an evidence-backed recommendation.
   * Absent on legacy payloads.
   */
  is_exploratory?: boolean;
  /** Exploratory only: what the user explicitly stated (not verified). */
  stated?: string[];
  /** Exploratory only: calibrated inferences and open unknowns. */
  inferred?: string[];
  /** Exploratory only: trade-offs and alternatives specific to this decision. */
  tradeoffs?: string[];
};

export type BriefingContext = {
  verdict: Verdict;
  confidence: Confidence;
};
