import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { OutdatedAnalysisBanner } from "@/components/outdated-analysis-banner";
import { supabase } from "@/integrations/supabase/client";
import { DIMENSIONS, DIMENSIONS_BY_KEY, type DimensionKey } from "@/lib/dimensions";
import { overallLabel } from "@/lib/analysis";
import type {
  PrioritizedAction,
  QualityIndicators,
  ActionPriority,
} from "@/lib/analysis";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  History,
  ListChecks,
  ShieldAlert,
  Target,
  TrendingUp,
  TrendingDown,
  Gauge,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/boards/$id_/analysis")({
  head: () => ({
    meta: [{ title: "Analysis Results — Axiora" }],
  }),
  component: Analysis,
});

type DimResult = {
  readiness?: string;
  readiness_score?: number;
  confidence_score?: number;
  confidence_level?: string;
  supporting_evidence?: string[];
  missing_evidence?: string[];
  strengths?: string[];
  risks?: string[];
  recommended_actions?: string[];
  prioritized_actions?: PrioritizedAction[];
  quality?: QualityIndicators;
  evidence_count?: number;
  key_risk?: string;
  overall_status?: string;
};

type AnalysisRow = {
  id: string;
  board_id: string;
  overall_readiness: string | null;
  recommendation: string | null;
  decision_brief: string | null;
  dimension_results: Record<string, DimResult> | null;
  analysis_version: number | null;
  confidence_score?: number | null;
  created_at: string;
};

function scoreColor(s?: number | null) {
  if (s == null) return "text-muted-foreground";
  if (s >= 75) return "text-success";
  if (s >= 55) return "text-info";
  return "text-warning";
}

function confidenceTone(level?: string | null) {
  if (level === "High") return "border-success/30 bg-success/10 text-success";
  if (level === "Medium") return "border-info/30 bg-info/10 text-info";
  if (level === "Low") return "border-warning/30 bg-warning/10 text-warning";
  return "border-border bg-surface-muted text-muted-foreground";
}

function priorityTone(p?: ActionPriority) {
  if (p === "High") return "border-warning/30 bg-warning/10 text-warning";
  if (p === "Medium") return "border-info/30 bg-info/10 text-info";
  return "border-border bg-surface-muted text-muted-foreground";
}

function QualityBar({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 75 ? "bg-success" : value >= 50 ? "bg-info" : "bg-warning";
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums text-foreground">{value}%</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full ${tone}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function Analysis() {
  const { id } = Route.useParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const historyQuery = useQuery({
    queryKey: ["analysis-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_analyses")
        .select("*")
        .eq("board_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AnalysisRow[];
    },
  });

  const analyses = historyQuery.data ?? [];
  const analysis = useMemo<AnalysisRow | undefined>(
    () => analyses.find((a) => a.id === selectedId) ?? analyses[0],
    [analyses, selectedId],
  );
  const isViewingHistorical =
    !!analysis && !!analyses[0] && analysis.id !== analyses[0].id;

  const dimResults = (analysis?.dimension_results ?? {}) as Record<
    DimensionKey,
    DimResult | undefined
  >;

  // Executive summary derivation.
  const summary = useMemo(() => {
    if (!analysis) return null;
    const overallScore =
      typeof analysis.overall_readiness === "number"
        ? (analysis.overall_readiness as number)
        : Number(analysis.overall_readiness) || 0;

    const entries = DIMENSIONS.map((d) => ({
      key: d.key,
      name: d.name,
      score: dimResults[d.key]?.readiness_score ?? 0,
      risk: dimResults[d.key]?.key_risk,
    })).filter((e) => (dimResults[e.key]?.evidence_count ?? 0) > 0 || e.score > 0);

    const strongest = entries.length
      ? [...entries].sort((a, b) => b.score - a.score)[0]
      : null;
    const weakest = entries.length
      ? [...entries].sort((a, b) => a.score - b.score)[0]
      : null;

    return {
      overallScore,
      assessment: overallLabel(overallScore),
      confidence: analysis.confidence_score ?? null,
      strongest,
      weakest,
      primaryRisk: weakest?.risk ?? null,
    };
  }, [analysis, dimResults]);

  return (
    <AppShell
      title="Analysis Results"
      subtitle="Readiness synthesis across all five dimensions"
    >
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-6">
          <Link
            to="/boards/$id"
            params={{ id }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Board
          </Link>

          <OutdatedAnalysisBanner boardId={id} />

          {isViewingHistorical && (
            <div className="rounded-xl border border-info/30 bg-info/5 px-4 py-3 text-sm">
              <span className="font-medium">Viewing historical analysis.</span>{" "}
              This version is read-only.{" "}
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="text-info underline"
              >
                Return to latest
              </button>
              .
            </div>
          )}

          {historyQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading analysis…
            </div>
          ) : !analysis ? (
            <section className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-surface-muted">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <h1 className="mt-4 font-display text-2xl">No Analysis Yet</h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Add evidence across the five readiness dimensions, then run
                Analyze Decision on the board overview to generate your first
                synthesis.
              </p>
              <Link
                to="/boards/$id"
                params={{ id }}
                className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Board
              </Link>
            </section>
          ) : (
            <>
              {/* Executive Summary */}
              {summary && (
                <section className="rounded-2xl border border-border bg-primary p-6 text-primary-foreground md:p-8">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] opacity-75">
                    <Sparkles className="h-3.5 w-3.5" /> Executive Summary
                  </div>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
                    <div>
                      <div className="font-display text-5xl leading-none md:text-6xl">
                        {summary.assessment}
                      </div>
                      <p className="mt-3 max-w-xl text-sm opacity-90">
                        {analysis.recommendation ?? analysis.decision_brief ?? ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-widest opacity-70">
                        Overall Score
                      </div>
                      <div className="font-display text-5xl leading-none tabular-nums">
                        {summary.overallScore}
                        <span className="text-2xl opacity-70"> / 100</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-primary-foreground/15 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest opacity-70">
                        Confidence
                      </div>
                      <div className="mt-1 font-display text-xl">
                        {summary.confidence != null
                          ? `${summary.confidence}%`
                          : "—"}
                      </div>
                      <div className="text-[11px] opacity-80">
                        {analyses[0]?.dimension_results
                          ? // Overall confidence level bucket
                            summary.confidence == null
                            ? ""
                            : summary.confidence >= 75
                              ? "High"
                              : summary.confidence >= 50
                                ? "Medium"
                                : "Low"
                          : ""}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest opacity-70">
                        <TrendingUp className="h-3 w-3" /> Strongest
                      </div>
                      <div className="mt-1 font-display text-xl">
                        {summary.strongest?.name ?? "—"}
                      </div>
                      {summary.strongest && (
                        <div className="text-[11px] opacity-80">
                          Score {summary.strongest.score}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest opacity-70">
                        <TrendingDown className="h-3 w-3" /> Weakest
                      </div>
                      <div className="mt-1 font-display text-xl">
                        {summary.weakest?.name ?? "—"}
                      </div>
                      {summary.weakest && (
                        <div className="text-[11px] opacity-80">
                          Score {summary.weakest.score}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest opacity-70">
                        <ShieldAlert className="h-3 w-3" /> Primary Risk
                      </div>
                      <div className="mt-1 text-sm leading-snug opacity-95">
                        {summary.primaryRisk ?? "None identified"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-4 text-[11px] uppercase tracking-widest opacity-60">
                    <span>Version {analysis.analysis_version ?? 1}</span>
                    <span>{new Date(analysis.created_at).toLocaleString()}</span>
                  </div>
                </section>
              )}

              {DIMENSIONS.map((d) => {
                const r: DimResult = dimResults[d.key] ?? {};
                const missing = r.missing_evidence ?? [];
                const actions =
                  r.prioritized_actions ??
                  (r.recommended_actions ?? []).map((a) => ({
                    action: a,
                    priority: "Medium" as ActionPriority,
                    impact: "",
                  }));
                const quality = r.quality;
                const cfg = DIMENSIONS_BY_KEY[d.key];

                return (
                  <section
                    key={d.key}
                    className="rounded-xl border border-border bg-surface p-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-muted">
                        <d.icon className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold">{d.name}</h2>
                        <p className="text-xs text-muted-foreground">
                          {r.overall_status ?? "—"}
                        </p>
                      </div>
                      {r.confidence_level && (
                        <div
                          className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${confidenceTone(r.confidence_level)}`}
                        >
                          <Gauge className="h-3 w-3" />
                          <span className="tabular-nums">
                            {typeof r.confidence_score === "number"
                              ? `${r.confidence_score}%`
                              : ""}
                          </span>
                          <span className="opacity-70">·</span>
                          <span>{r.confidence_level}</span>
                        </div>
                      )}
                      <div
                        className={`font-display text-2xl ${scoreColor(r.readiness_score)}`}
                      >
                        {r.readiness ?? "—"}
                      </div>
                    </div>

                    {quality && (
                      <div className="mt-5 grid gap-4 rounded-lg border border-border bg-surface-muted/40 p-4 sm:grid-cols-3">
                        <QualityBar label="Coverage" value={quality.coverage} />
                        <QualityBar label="Freshness" value={quality.freshness} />
                        <QualityBar label="Quality" value={quality.quality} />
                      </div>
                    )}

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                          <CheckCircle2 className="h-4 w-4 text-success" />{" "}
                          Strengths
                        </h3>
                        <ul className="mt-3 space-y-2 text-sm">
                          {(r.strengths ?? r.supporting_evidence ?? []).map(
                            (e, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                <span>{e}</span>
                              </li>
                            ),
                          )}
                          {(r.strengths ?? r.supporting_evidence ?? []).length ===
                            0 && (
                            <li className="text-muted-foreground">
                              No strengths surfaced yet. Add supporting evidence
                              to build a stronger case.
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="flex items-center gap-2 text-sm font-semibold">
                            <ShieldAlert className="h-4 w-4 text-warning" /> Risks
                          </h3>
                          <ul className="mt-3 space-y-2 text-sm">
                            {(r.risks ?? []).map((e, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                                <span>{e}</span>
                              </li>
                            ))}
                            {(r.risks ?? []).length === 0 && (
                              <li className="text-muted-foreground">
                                No blocking risks identified.
                              </li>
                            )}
                          </ul>
                        </div>

                        {missing.length > 0 && (
                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                              Missing Evidence
                            </h3>
                            <ul className="mt-2 flex flex-wrap gap-1.5">
                              {missing.map((m, i) => (
                                <li
                                  key={i}
                                  className="rounded-full border border-warning/30 bg-warning/5 px-2.5 py-1 text-[11px] font-medium text-warning"
                                >
                                  {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {actions.length > 0 && (
                      <div className="mt-6 rounded-lg border border-border bg-surface-muted/40 p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          <Target className="h-3.5 w-3.5" /> Next actions
                        </div>
                        <ul className="mt-3 space-y-2.5 text-sm">
                          {actions
                            .slice()
                            .sort((a, b) => {
                              const rank = { High: 0, Medium: 1, Low: 2 };
                              return (
                                (rank[a.priority] ?? 3) -
                                (rank[b.priority] ?? 3)
                              );
                            })
                            .map((a, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-3 rounded-md border border-border bg-surface p-3"
                              >
                                <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium">
                                      {a.action}
                                    </span>
                                    <span
                                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityTone(a.priority)}`}
                                    >
                                      {a.priority}
                                    </span>
                                  </div>
                                  {a.impact && (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      {a.impact}
                                    </div>
                                  )}
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {(r.evidence_count ?? 0) === 0 && (
                      <div className="mt-4 rounded-lg border border-dashed border-border bg-surface-muted/40 p-4 text-sm text-muted-foreground">
                        No {cfg.name.toLowerCase()} evidence yet. Add
                        interviews, analytics, or stakeholder feedback to
                        strengthen this dimension.
                      </div>
                    )}
                  </section>
                );
              })}
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Decision history
            </div>
            {analyses.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Run your first analysis to build a decision history.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {analyses.map((a) => {
                  const active = a.id === (analysis?.id ?? "");
                  const scoreNum =
                    typeof a.overall_readiness === "number"
                      ? (a.overall_readiness as number)
                      : Number(a.overall_readiness) || 0;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(a.id)}
                        className={`w-full rounded-md border px-3 py-2 text-left text-xs transition ${
                          active
                            ? "border-accent/40 bg-accent/10"
                            : "border-border hover:bg-surface-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">
                            v{a.analysis_version ?? 1}
                          </span>
                          <span
                            className={`font-medium ${scoreColor(scoreNum)}`}
                          >
                            {overallLabel(scoreNum)}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {new Date(a.created_at).toLocaleString()}
                        </div>
                        {typeof a.confidence_score === "number" && (
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            Confidence {a.confidence_score}%
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
