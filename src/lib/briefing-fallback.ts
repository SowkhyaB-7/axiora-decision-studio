import type { Briefing } from "@/lib/briefing";
import {
  CATEGORY_LABEL,
  type Assessment,
  type EvidenceItem,
} from "@/lib/verdict";

/**
 * Deterministic briefing copy. Used when there is no evidence to reason about,
 * and as the safety net when AI text generation fails or returns nonsense.
 * It never states anything beyond what the stored evidence records say.
 */
export function fallbackBriefing(
  assessment: Assessment,
  items: EvidenceItem[],
): Briefing {
  const gaps = assessment.uncoveredCategories.map(
    (c) =>
      `Confirm ${CATEGORY_LABEL[c].toLowerCase()} evidence for this decision — nothing substantive is on record yet.`,
  );

  if (items.length === 0) {
    return {
      why: "Axiora doesn't have enough evidence to make a responsible recommendation yet. Nothing has been added to this decision.",
      supports: [],
      contradicts: [],
      unresolved: null,
      missing: [
        "Add customer evidence: interviews, feedback or support threads.",
        "Add technical evidence: feasibility or effort estimates.",
        "Add business evidence: pipeline, pricing or revenue impact.",
      ],
      next_action: "Add your first piece of evidence.",
      ai_generated: false,
    };
  }

  const claim = (e: EvidenceItem) => ({
    claim: e.takeaway?.trim() || e.title,
    evidence_refs: [e.ref],
  });

  return {
    why:
      assessment.verdict === "INSUFFICIENT_EVIDENCE"
        ? `Axiora doesn't have enough evidence to make a responsible recommendation yet. ${assessment.ruleTrace.join(" ")}`
        : assessment.ruleTrace.join(" "),
    supports: [...assessment.supporting, ...assessment.neutral].map(claim),
    contradicts: assessment.contradicting.map(claim),
    unresolved: assessment.isConflict
      ? "The recorded evidence points in opposing directions. Which side holds under scrutiny?"
      : null,
    missing: gaps.length
      ? gaps
      : ["Strengthen the existing evidence with a second independent source."],
    next_action: assessment.isConflict
      ? "Resolve the disagreement between the supporting and contradicting evidence before deciding."
      : gaps.length
        ? `Gather ${CATEGORY_LABEL[assessment.uncoveredCategories[0]!].toLowerCase()} evidence.`
        : "Review the evidence and decide.",
    ai_generated: false,
  };
}
