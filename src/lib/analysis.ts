import { EVIDENCE_TYPES } from "@/lib/evidence";
import { DIMENSIONS_BY_KEY, type DimensionKey } from "@/lib/dimensions";

export type AnalysisEvidence = {
  title: string;
  evidence_type: string | null;
  evidence_strength: string | null;
  evidence_date: string | null;
};

export type DimensionAnalysisResult = {
  dimension: DimensionKey;
  readiness: "High" | "Medium" | "Low";
  readiness_score: number;
  supporting_evidence: string[];
  missing_evidence: string[];
  key_risk: string;
  overall_status: string;
};

// Backwards-compat alias — Customer Validation was the first dimension.
export type CVAnalysisResult = DimensionAnalysisResult;

const STRENGTH_WEIGHT: Record<string, number> = {
  weak: 0.3,
  medium: 0.6,
  strong: 1.0,
};

function pluralize(n: number, singular: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${singular}s`;
}

function isRecent(dateStr: string | null, days = 180): boolean {
  if (!dateStr) return false;
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= days * 24 * 60 * 60 * 1000;
}

/**
 * Deterministic, rule-based readiness scoring for a single dimension.
 * Same algorithm powers every dimension; only the "key evidence types"
 * differ per dimension (see DIMENSIONS config).
 */
export function analyzeDimension(
  dimensionKey: DimensionKey,
  evidence: AnalysisEvidence[],
): DimensionAnalysisResult {
  const cfg = DIMENSIONS_BY_KEY[dimensionKey];
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
  const recencyScore =
    count === 0
      ? 0
      : evidence.filter((e) => isRecent(e.evidence_date)).length / count;

  const score = Math.round(
    100 *
      (0.4 * typeCoverage +
        0.25 * strengthAvg +
        0.2 * volumeScore +
        0.15 * recencyScore),
  );

  const readiness: "High" | "Medium" | "Low" =
    score >= 75 ? "High" : score >= 50 ? "Medium" : "Low";

  const supporting_evidence =
    count === 0
      ? []
      : Array.from(byType.entries())
          .sort((a, b) => b[1].length - a[1].length)
          .map(([type, rows]) => {
            const strong = rows.filter(
              (r) => (r.evidence_strength ?? "").toLowerCase() === "strong",
            ).length;
            const base = pluralize(rows.length, type.toLowerCase());
            return strong > 0 ? `${base} (${strong} strong)` : base;
          });

  const missing_evidence = missingKeyTypes.map((t) => `No ${t.toLowerCase()}s yet`);

  const components: { key: string; value: number; risk: string }[] = [
    {
      key: "coverage",
      value: typeCoverage,
      risk:
        missingKeyTypes.length > 0
          ? `Narrow evidence base — missing ${missingKeyTypes[0].toLowerCase()}s`
          : "Narrow evidence base",
    },
    {
      key: "strength",
      value: strengthAvg,
      risk: "Evidence quality is weak — few sources rated Strong",
    },
    {
      key: "volume",
      value: volumeScore,
      risk: "Too few data points to draw a confident conclusion",
    },
    {
      key: "recency",
      value: recencyScore,
      risk: "Evidence is stale — most items are older than 6 months",
    },
  ];
  const key_risk =
    count === 0
      ? `No ${cfg.name.toLowerCase()} evidence has been collected yet`
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
    supporting_evidence,
    missing_evidence,
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
  if (score >= 75) return "Proceed — evidence supports moving forward.";
  if (score >= 50)
    return "Proceed with caution — strengthen weak areas before committing.";
  return "Hold — gather more evidence before deciding.";
}

void EVIDENCE_TYPES;
