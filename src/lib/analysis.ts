import { EVIDENCE_TYPES } from "@/lib/evidence";
import { DIMENSIONS_BY_KEY, type DimensionKey } from "@/lib/dimensions";

export type AnalysisEvidence = {
  title: string;
  evidence_type: string | null;
  evidence_strength: string | null;
  evidence_date: string | null;
};

export type ConfidenceLevel = "High" | "Medium" | "Low";
export type ActionPriority = "High" | "Medium" | "Low";

export type PrioritizedAction = {
  action: string;
  priority: ActionPriority;
  impact: string;
};

export type QualityIndicators = {
  coverage: number; // 0-100
  freshness: number; // 0-100
  quality: number; // 0-100
};

export type DimensionAnalysisResult = {
  dimension: DimensionKey;
  readiness: "High" | "Medium" | "Low";
  readiness_score: number;
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  supporting_evidence: string[];
  missing_evidence: string[];
  strengths: string[];
  risks: string[];
  recommended_actions: string[]; // legacy — plain strings
  prioritized_actions: PrioritizedAction[];
  quality: QualityIndicators;
  evidence_count: number;
  key_risk: string;
  overall_status: string;
};

// Backwards-compat alias.
export type CVAnalysisResult = DimensionAnalysisResult;

const STRENGTH_WEIGHT: Record<string, number> = {
  weak: 0.3,
  medium: 0.6,
  strong: 1.0,
};

function numberWord(n: number): string {
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  return words[n] ?? String(n);
}

function isRecent(dateStr: string | null, days = 180): boolean {
  if (!dateStr) return false;
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= days * 24 * 60 * 60 * 1000;
}

function toLevel(score01: number): ConfidenceLevel {
  if (score01 >= 0.75) return "High";
  if (score01 >= 0.5) return "Medium";
  return "Low";
}

/**
 * Deterministic, rule-based readiness scoring for a single dimension.
 */
export function analyzeDimension(
  dimensionKey: DimensionKey,
  evidence: AnalysisEvidence[],
): DimensionAnalysisResult {
  const cfg = DIMENSIONS_BY_KEY[dimensionKey];
  const dimNameLower = cfg.name.toLowerCase();
  const keyTypes = cfg.keyEvidenceTypes;
  const count = evidence.length;

  const byType = new Map<string, AnalysisEvidence[]>();
  for (const e of evidence) {
    const t = (e.evidence_type ?? "Other").trim() || "Other";
    const arr = byType.get(t) ?? [];
    arr.push(e);
    byType.set(t, arr);
  }

  const presentKeyTypes = keyTypes.filter((t) => byType.has(t));
  const missingKeyTypes = keyTypes.filter((t) => !byType.has(t));
  const strongCount = evidence.filter(
    (e) => (e.evidence_strength ?? "").toLowerCase() === "strong",
  ).length;
  const recentCount = evidence.filter((e) => isRecent(e.evidence_date)).length;

  const typeCoverage =
    keyTypes.length === 0 ? 0 : presentKeyTypes.length / keyTypes.length;

  const strengthAvg =
    count === 0
      ? 0
      : evidence.reduce(
          (sum, e) =>
            sum +
            (STRENGTH_WEIGHT[(e.evidence_strength ?? "").toLowerCase()] ?? 0.4),
          0,
        ) / count;

  const volumeScore = Math.min(count / 5, 1);
  const recencyScore = count === 0 ? 0 : recentCount / count;

  const score = Math.round(
    100 *
      (0.4 * typeCoverage +
        0.25 * strengthAvg +
        0.2 * volumeScore +
        0.15 * recencyScore),
  );

  const readiness: "High" | "Medium" | "Low" =
    score >= 75 ? "High" : score >= 50 ? "Medium" : "Low";

  const confidenceRaw =
    count === 0
      ? 0
      : 0.5 * strengthAvg + 0.3 * typeCoverage + 0.2 * recencyScore;
  const confidence_score = Math.round(confidenceRaw * 100);
  const confidence_level = toLevel(confidenceRaw);

  // Supporting evidence — used as fallback in older UI paths.
  const supporting_evidence =
    count === 0
      ? []
      : Array.from(byType.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .map(([type, rows]) => {
            const strong = rows.filter(
              (r) => (r.evidence_strength ?? "").toLowerCase() === "strong",
            ).length;
            const suffix = strong > 0 ? ` (${strong} strong)` : "";
            const label = rows.length === 1 ? type : `${type}s`;
            return `${rows.length} ${label.toLowerCase()}${suffix}`;
          });

  // Missing evidence — return as clean, capitalized type names for structured display.
  const missing_evidence = missingKeyTypes.map((t) => t);

  // Strengths — natural PM language.
  const strengths: string[] = [];
  if (typeCoverage >= 0.75) {
    strengths.push(
      `Evidence spans ${presentKeyTypes.length} of ${keyTypes.length} key ${dimNameLower} sources.`,
    );
  }
  if (strongCount >= 2) {
    strengths.push(
      `${numberWord(strongCount).replace(/^./, (c) => c.toUpperCase())} strong evidence sources support this assessment.`,
    );
  } else if (strongCount === 1) {
    strengths.push("One strong evidence source supports this assessment.");
  }
  if (recencyScore >= 0.7 && count > 0) {
    strengths.push(
      "Most supporting evidence has been collected within the last six months.",
    );
  }
  if (volumeScore >= 0.8) {
    strengths.push(
      `A healthy volume of evidence (${count} items) informs this dimension.`,
    );
  }
  if (strengths.length === 0 && count > 0) {
    strengths.push(
      `${count} evidence ${count === 1 ? "item has" : "items have"} been collected so far.`,
    );
  }

  // Risks — natural PM language.
  const risks: string[] = [];
  if (count === 0) {
    risks.push(
      `No ${dimNameLower} evidence has been collected yet. This dimension has no supporting data.`,
    );
  } else {
    if (missingKeyTypes.length > 0) {
      risks.push(
        `Additional supporting evidence is recommended to strengthen ${dimNameLower}.`,
      );
    }
    if (strengthAvg < 0.5) {
      risks.push(
        "Overall evidence quality is limited. Few sources are rated as strong.",
      );
    }
    if (recencyScore < 0.4) {
      risks.push(
        "Most evidence is more than six months old and may no longer reflect current reality.",
      );
    }
    if (volumeScore < 0.4) {
      risks.push(
        "There are too few data points to draw a confident conclusion.",
      );
    }
  }

  // Prioritized actions.
  const prioritized_actions: PrioritizedAction[] = [];
  for (const t of missingKeyTypes.slice(0, 3)) {
    prioritized_actions.push({
      action: `Collect at least one ${t.toLowerCase()}.`,
      priority: "High",
      impact: `Directly closes a gap in ${cfg.name}.`,
    });
  }
  if (count > 0 && strengthAvg < 0.6) {
    prioritized_actions.push({
      action: "Strengthen weak sources with more authoritative or primary evidence.",
      priority: "Medium",
      impact: "Improves confidence in the current assessment.",
    });
  }
  if (count > 0 && recencyScore < 0.5) {
    prioritized_actions.push({
      action: "Refresh outdated evidence with data from the last quarter.",
      priority: "Medium",
      impact: "Keeps the assessment grounded in current reality.",
    });
  }
  if (count > 0 && volumeScore < 0.6 && missingKeyTypes.length === 0) {
    prioritized_actions.push({
      action: "Add more supporting evidence across existing sources.",
      priority: "Low",
      impact: "Strengthens the signal without adding new source types.",
    });
  }
  if (prioritized_actions.length === 0) {
    prioritized_actions.push({
      action: "Revisit this dimension before finalizing the decision.",
      priority: "Low",
      impact: "Keeps the assessment trustworthy over time.",
    });
  }

  const recommended_actions = prioritized_actions.map((a) => a.action);

  const components: { value: number; risk: string }[] = [
    {
      value: typeCoverage,
      risk:
        missingKeyTypes.length > 0
          ? `Narrow evidence base — no ${missingKeyTypes[0].toLowerCase()} yet`
          : "Narrow evidence base",
    },
    { value: strengthAvg, risk: "Evidence quality is weak — few sources rated strong" },
    { value: volumeScore, risk: "Too few data points to draw a confident conclusion" },
    { value: recencyScore, risk: "Evidence is stale — most items are older than six months" },
  ];
  const key_risk =
    count === 0
      ? `No ${dimNameLower} evidence collected yet`
      : components.sort((a, b) => a.value - b.value)[0].risk;

  const overall_status =
    count === 0
      ? "No evidence collected."
      : readiness === "High"
        ? `${cfg.name} is well supported.`
        : readiness === "Medium"
          ? `${cfg.name} is partially supported.`
          : `${cfg.name} lacks sufficient evidence.`;

  return {
    dimension: dimensionKey,
    readiness,
    readiness_score: score,
    confidence_score,
    confidence_level,
    supporting_evidence,
    missing_evidence,
    strengths,
    risks,
    recommended_actions,
    prioritized_actions,
    quality: {
      coverage: Math.round(typeCoverage * 100),
      freshness: Math.round(recencyScore * 100),
      quality: Math.round(strengthAvg * 100),
    },
    evidence_count: count,
    key_risk,
    overall_status,
  };
}

/** Backwards-compat wrapper. */
export function analyzeCustomerValidation(
  evidence: AnalysisEvidence[],
): DimensionAnalysisResult {
  return analyzeDimension("customer_validation", evidence);
}

export function recommendationFor(score: number): string {
  if (score >= 75)
    return "Proceed — the evidence supports moving forward with this decision.";
  if (score >= 50)
    return "Proceed with caution — strengthen the weakest dimensions before committing.";
  return "Hold — gather more evidence before making this decision.";
}

export function overallLabel(score: number): string {
  if (score >= 75) return "Ready";
  if (score >= 55) return "Ready with Conditions";
  return "Not Ready";
}

export function overallConfidence(results: DimensionAnalysisResult[]): {
  score: number;
  level: ConfidenceLevel;
} {
  if (results.length === 0) return { score: 0, level: "Low" };
  const avg = Math.round(
    results.reduce((s, r) => s + r.confidence_score, 0) / results.length,
  );
  return { score: avg, level: toLevel(avg / 100) };
}

void EVIDENCE_TYPES;
