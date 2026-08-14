/**
 * Axiora deterministic verdict engine.
 *
 * The LLM never decides the verdict. It only extracts and describes evidence.
 * Everything in this file is plain, inspectable application logic, and every
 * threshold lives in RULES so it can be reviewed or tuned in one place.
 *
 * There are no numeric scores in the product surface. Counts are used
 * internally to reach a qualitative state; they are never shown as a score.
 */

export const CATEGORIES = ["CUSTOMER", "TECHNICAL", "BUSINESS"] as const;
export type Category = (typeof CATEGORIES)[number];

export const DIRECTIONS = ["SUPPORTS", "CONTRADICTS", "NEUTRAL"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const STRENGTHS = ["WEAK", "MODERATE", "STRONG"] as const;
export type Strength = (typeof STRENGTHS)[number];

export type Verdict =
  | "INSUFFICIENT_EVIDENCE"
  | "EVIDENCE_CONFLICT"
  | "NOT_READY"
  | "ALMOST_READY"
  | "READY"
  | "DECIDED";

export type Confidence = "High" | "Medium" | "Low";

export type EvidenceItem = {
  id: string;
  ref: number;
  title: string;
  raw_text: string;
  category: Category;
  direction: Direction;
  strength: Strength;
  takeaway: string | null;
  created_at: string;
};

export const RULES = {
  /** Below this many evidence items, Axiora refuses to recommend anything. */
  MIN_EVIDENCE_ITEMS: 3,
  /** Weak items don't count toward substance. */
  MIN_SUBSTANTIVE_ITEMS: 2,
  /** A conflict needs substantive evidence on both sides. */
  CONFLICT_MIN_SUBSTANTIVE_PER_SIDE: 1,
  /** READY needs every category covered by substantive evidence. */
  REQUIRED_CATEGORIES: CATEGORIES,
  /** READY also needs this much substantive support. */
  READY_MIN_SUBSTANTIVE_SUPPORT: 3,
  READY_MIN_STRONG_SUPPORT: 1,
} as const;

export const VERDICT_LABEL: Record<Verdict, string> = {
  INSUFFICIENT_EVIDENCE: "Insufficient Evidence",
  EVIDENCE_CONFLICT: "Evidence Conflict",
  NOT_READY: "Not Ready",
  ALMOST_READY: "Almost Ready",
  READY: "Ready",
  DECIDED: "Decided",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  CUSTOMER: "Customer",
  TECHNICAL: "Technical",
  BUSINESS: "Business",
};

export const DIRECTION_LABEL: Record<Direction, string> = {
  SUPPORTS: "Supports",
  CONTRADICTS: "Contradicts",
  NEUTRAL: "Neutral",
};

export const STRENGTH_LABEL: Record<Strength, string> = {
  WEAK: "Weak",
  MODERATE: "Moderate",
  STRONG: "Strong",
};

export type Assessment = {
  verdict: Verdict;
  confidence: Confidence;
  confidenceReason: string;
  /** Categories with no substantive evidence yet. */
  uncoveredCategories: Category[];
  supporting: EvidenceItem[];
  contradicting: EvidenceItem[];
  neutral: EvidenceItem[];
  /** Plain-language explanation of why this state was reached. */
  ruleTrace: string[];
  isConflict: boolean;
  total: number;
};

const isSubstantive = (e: EvidenceItem) => e.strength !== "WEAK";

export function computeAssessment(
  items: EvidenceItem[],
  opts: { decided?: boolean } = {},
): Assessment {
  const supporting = items.filter((e) => e.direction === "SUPPORTS");
  const contradicting = items.filter((e) => e.direction === "CONTRADICTS");
  const neutral = items.filter((e) => e.direction === "NEUTRAL");

  const substantive = items.filter(isSubstantive);
  const substantiveSupport = supporting.filter(isSubstantive);
  const substantiveContra = contradicting.filter(isSubstantive);
  const strongSupport = supporting.filter((e) => e.strength === "STRONG");

  const covered = new Set(substantive.map((e) => e.category));
  const uncoveredCategories = RULES.REQUIRED_CATEGORIES.filter(
    (c) => !covered.has(c),
  );

  const trace: string[] = [];
  let verdict: Verdict;

  const isConflict =
    substantiveContra.length >= RULES.CONFLICT_MIN_SUBSTANTIVE_PER_SIDE &&
    substantiveSupport.length >= RULES.CONFLICT_MIN_SUBSTANTIVE_PER_SIDE;

  if (items.length < RULES.MIN_EVIDENCE_ITEMS) {
    verdict = "INSUFFICIENT_EVIDENCE";
    trace.push(
      items.length === 0
        ? "Nothing has been recorded yet, so there is nothing for Axiora to reason about."
        : "The evidence on record is too thin to stand behind a recommendation, and none of the three areas has been properly examined.",
    );
  } else if (substantive.length < RULES.MIN_SUBSTANTIVE_ITEMS) {
    verdict = "INSUFFICIENT_EVIDENCE";
    trace.push(
      "Almost everything on record is a weak signal: hearsay, single anecdotes or unquantified opinion. That isn't enough to justify a call either way.",
    );
  } else if (isConflict) {
    verdict = "EVIDENCE_CONFLICT";
    trace.push(
      "Credible evidence pulls in opposite directions here: what argues for going ahead and what argues against it are both substantive, and neither has been answered by the other. Axiora will not blend them into a middle-ground answer.",
    );
  } else if (substantiveContra.length > 0 && substantiveSupport.length === 0) {
    verdict = "NOT_READY";
    trace.push(
      "The only substantive evidence on record argues against launching.",
    );

  } else if (uncoveredCategories.length >= 2) {
    verdict = "NOT_READY";
    trace.push(
      `No substantive evidence yet for ${uncoveredCategories.map((c) => CATEGORY_LABEL[c]).join(" or ")}.`,
    );
  } else if (uncoveredCategories.length === 1) {
    verdict = "ALMOST_READY";
    trace.push(
      `Evidence covers two of three areas. ${CATEGORY_LABEL[uncoveredCategories[0]!]} is still unvalidated.`,
    );
  } else if (
    substantiveSupport.length >= RULES.READY_MIN_SUBSTANTIVE_SUPPORT &&
    strongSupport.length >= RULES.READY_MIN_STRONG_SUPPORT
  ) {
    verdict = "READY";
    trace.push(
      "Customer, technical and business evidence are all covered by substantive supporting evidence, with no substantive evidence against.",
    );
  } else {
    verdict = "ALMOST_READY";
    trace.push(
      "All three areas have some substantive evidence, but the supporting evidence is still thin.",
    );
  }

  if (opts.decided) {
    trace.unshift("This decision has been marked decided and is locked.");
  }

  const { confidence, confidenceReason } = computeConfidence({
    verdict,
    total: items.length,
    substantive: substantive.length,
    strongCount: items.filter((e) => e.strength === "STRONG").length,
    coveredCount: covered.size,
    isConflict,
  });

  return {
    verdict: opts.decided ? "DECIDED" : verdict,
    confidence,
    confidenceReason,
    uncoveredCategories,
    supporting,
    contradicting,
    neutral,
    ruleTrace: trace,
    isConflict,
    total: items.length,
  };
}

function computeConfidence(input: {
  verdict: Verdict;
  total: number;
  substantive: number;
  strongCount: number;
  coveredCount: number;
  isConflict: boolean;
}): { confidence: Confidence; confidenceReason: string } {
  if (input.total === 0) {
    return {
      confidence: "Low",
      confidenceReason: "There is no evidence on record yet.",
    };
  }
  if (input.isConflict) {
    return {
      confidence: "Low",
      confidenceReason:
        "Confidence is low because the evidence points in opposing directions and the disagreement has not been resolved.",
    };
  }
  if (input.verdict === "INSUFFICIENT_EVIDENCE") {
    return {
      confidence: "Low",
      confidenceReason:
        "Confidence is low because too little evidence has been gathered to judge this decision.",
    };
  }
  if (input.coveredCount === 3 && input.strongCount >= 2 && input.total >= 4) {
    return {
      confidence: "High",
      confidenceReason:
        "Confidence is high because customer, technical and business evidence are all represented, including more than one strong source.",
    };
  }
  if (input.coveredCount >= 2 && input.substantive >= 2) {
    return {
      confidence: "Medium",
      confidenceReason:
        input.coveredCount === 3
          ? "Confidence is medium because all three areas are covered, but few sources are rated strong."
          : "Confidence is medium because one of the three evidence areas is still unrepresented.",
    };
  }
  return {
    confidence: "Low",
    confidenceReason:
      "Confidence is low because the evidence is concentrated in a single area and mostly weak.",
  };
}

/** Stable fingerprint of the evidence set, used to cache briefing text. */
export function evidenceFingerprint(items: EvidenceItem[]): string {
  return items
    .map(
      (e) =>
        `${e.id}:${e.category}:${e.direction}:${e.strength}:${e.title}:${e.takeaway ?? ""}`,
    )
    .sort()
    .join("|");
}
