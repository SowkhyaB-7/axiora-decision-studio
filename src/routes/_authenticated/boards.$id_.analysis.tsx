import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { DIMENSIONS, type DimensionKey } from "@/lib/dimensions";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
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
  supporting_evidence?: string[];
  missing_evidence?: string[];
  key_risk?: string;
  overall_status?: string;
};

function scoreColor(s?: number | null) {
  if (s == null) return "text-muted-foreground";
  if (s >= 75) return "text-success";
  if (s >= 55) return "text-info";
  return "text-warning";
}

function Analysis() {
  const { id } = Route.useParams();

  const analysisQuery = useQuery({
    queryKey: ["latest-analysis", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_analyses")
        .select("*")
        .eq("board_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const analysis = analysisQuery.data;
  const dimResults = (analysis?.dimension_results ?? {}) as Record<
    DimensionKey,
    DimResult | undefined
  >;

  return (
    <AppShell title="Analysis Results" subtitle="Mocked analysis · MVP placeholder for AI output">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          to="/boards/$id"
          params={{ id }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to board
        </Link>

        {analysisQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading analysis…
          </div>
        ) : !analysis ? (
          <section className="rounded-2xl border border-border bg-surface p-8 text-center">
            <h1 className="font-display text-2xl">No analysis yet</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Run "Analyze decision" on the board overview to generate analysis output.
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
                <span>Version {analysis.analysis_version}</span>
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
                    <div className={`font-display text-2xl ${scoreColor(r.readiness_score)}`}>
                      {r.readiness ?? "—"}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-success" /> Supporting evidence
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm">
                        {(r.supporting_evidence ?? []).map((e, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {e}
                          </li>
                        ))}
                        {(r.supporting_evidence?.length ?? 0) === 0 && (
                          <li className="text-muted-foreground">None</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <AlertTriangle className="h-4 w-4 text-warning" /> Missing evidence
                      </h3>
                      <ul className="mt-3 space-y-2 text-sm">
                        {(r.missing_evidence ?? []).map((e, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> {e}
                          </li>
                        ))}
                        {(r.missing_evidence?.length ?? 0) === 0 && (
                          <li className="text-muted-foreground">None</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {r.key_risk && (
                    <div className="mt-6 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm">
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
    </AppShell>
  );
}
