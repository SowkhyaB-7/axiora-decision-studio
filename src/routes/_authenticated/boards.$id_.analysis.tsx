import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { OutdatedAnalysisBanner } from "@/components/outdated-analysis-banner";
import { supabase } from "@/integrations/supabase/client";
import { DIMENSIONS, type DimensionKey } from "@/lib/dimensions";
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

  return (
    <AppShell
      title="Analysis Results"
      subtitle="Deterministic readiness synthesis · MVP"
    >
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-6">
          <Link
            to="/boards/$id"
            params={{ id }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to board
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
            <section className="rounded-2xl border border-border bg-surface p-8 text-center">
              <h1 className="font-display text-2xl">No analysis yet</h1>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Run "Analyze decision" on the board overview to generate your
                first readiness synthesis.
              </p>
              <Link
                to="/boards/$id"
                params={{ id }}
                className="mt-4 inline-block text-sm text-accent hover:underline"
              >
                Back to board
              </Link>
            </section>
          ) : (
            <>
              <section className="rounded-2xl border border-border bg-primary p-6 text-primary-foreground md:p-8">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-70">
                  <Sparkles className="h-3.5 w-3.5" /> Overall readiness
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-6">
                  <div className="font-display text-6xl leading-none">
                    {analysis.overall_readiness ?? "—"}
                  </div>
                  <div className="max-w-xl text-sm opacity-90">
                    {analysis.recommendation ?? analysis.decision_brief ?? ""}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-[11px] uppercase tracking-widest opacity-70">
                  <span>Version {analysis.analysis_version ?? 1}</span>
                  {typeof analysis.confidence_score === "number" && (
                    <span>Confidence {analysis.confidence_score}%</span>
                  )}
                  <span>{new Date(analysis.created_at).toLocaleString()}</span>
                </div>
              </section>

              {DIMENSIONS.map((d) => {
                const r: DimResult = dimResults[d.key] ?? {};
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
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${confidenceTone(r.confidence_level)}`}
                        >
                          {r.confidence_level} confidence
                          {typeof r.confidence_score === "number"
                            ? ` · ${r.confidence_score}%`
                            : ""}
                        </span>
                      )}
                      <div
                        className={`font-display text-2xl ${scoreColor(r.readiness_score)}`}
                      >
                        {r.readiness ?? "—"}
                      </div>
                    </div>

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
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{" "}
                                {e}
                              </li>
                            ),
                          )}
                          {(r.strengths ?? r.supporting_evidence ?? []).length ===
                            0 && (
                            <li className="text-muted-foreground">
                              No strengths identified yet.
                            </li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                          <ShieldAlert className="h-4 w-4 text-warning" /> Risks
                        </h3>
                        <ul className="mt-3 space-y-2 text-sm">
                          {(r.risks ?? r.missing_evidence ?? []).map((e, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{" "}
                              {e}
                            </li>
                          ))}
                          {(r.risks ?? r.missing_evidence ?? []).length === 0 && (
                            <li className="text-muted-foreground">
                              No blocking risks identified.
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {(r.recommended_actions?.length ?? 0) > 0 && (
                      <div className="mt-6 rounded-lg border border-border bg-surface-muted/50 p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          <Target className="h-3.5 w-3.5" /> Next actions
                        </div>
                        <ul className="mt-2 space-y-1.5 text-sm">
                          {r.recommended_actions!.map((a, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{" "}
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {r.key_risk && (
                      <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-warning">
                          <AlertTriangle className="h-3.5 w-3.5" /> Key risk
                        </div>
                        <p className="mt-1">{r.key_risk}</p>
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
                No analyses recorded yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {analyses.map((a) => {
                  const active = a.id === (analysis?.id ?? "");
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
                            className={`font-medium ${
                              a.overall_readiness === "High"
                                ? "text-success"
                                : a.overall_readiness === "Medium"
                                  ? "text-info"
                                  : "text-warning"
                            }`}
                          >
                            {a.overall_readiness ?? "—"}
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
