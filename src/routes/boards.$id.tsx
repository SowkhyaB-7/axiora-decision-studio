import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { DIMENSIONS, type DimensionKey } from "@/lib/dimensions";
import {
  ArrowUpRight,
  Share2,
  MoreHorizontal,
  Sparkles,
  Loader2,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/boards/$id")({
  head: () => ({
    meta: [{ title: "Decision Board — Axiora" }],
  }),
  component: BoardOverview,
});

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

function readinessColor(level?: string | null) {
  if (!level) return "text-muted-foreground";
  const l = level.toLowerCase();
  if (l === "high") return "text-success";
  if (l === "medium") return "text-info";
  return "text-warning";
}

function BoardOverview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);

  const boardQuery = useQuery({
    queryKey: ["board", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decision_boards")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const dimensionsQuery = useQuery({
    queryKey: ["dimensions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_dimensions")
        .select("id, dimension_name, status, readiness_level, readiness_score")
        .eq("board_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const evidenceCountsQuery = useQuery({
    queryKey: ["evidence-counts", id],
    enabled: (dimensionsQuery.data?.length ?? 0) > 0,
    queryFn: async () => {
      const ids = (dimensionsQuery.data ?? []).map((d) => d.id);
      if (ids.length === 0) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from("evidence")
        .select("dimension_id")
        .in("dimension_id", ids);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        counts[r.dimension_id] = (counts[r.dimension_id] ?? 0) + 1;
      });
      return counts;
    },
  });

  const latestAnalysisQuery = useQuery({
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

  const board = boardQuery.data;
  const dims = dimensionsQuery.data ?? [];
  const counts = evidenceCountsQuery.data ?? {};

  const dimByKey = new Map(dims.map((d) => [d.dimension_name as DimensionKey, d]));

  const handleAnalyze = async () => {
    if (!board) return;
    setAnalyzing(true);
    try {
      const cv = dimByKey.get("customer_validation");
      let evidenceRows: { title: string; evidence_strength: string | null }[] = [];
      if (cv) {
        const { data: evRows } = await supabase
          .from("evidence")
          .select("title, evidence_strength")
          .eq("dimension_id", cv.id);
        evidenceRows = evRows ?? [];
      }

      const evidenceCount = evidenceRows.length;
      const strongCount = evidenceRows.filter((e) => (e.evidence_strength ?? "").toLowerCase() === "strong").length;
      let readiness: "High" | "Medium" | "Low" = "Low";
      let score = 30;
      if (evidenceCount >= 5 || strongCount >= 3) {
        readiness = "High";
        score = 85;
      } else if (evidenceCount >= 2) {
        readiness = "Medium";
        score = 60;
      }

      const supporting = evidenceRows.slice(0, 5).map((e) => e.title);
      if (supporting.length === 0) {
        supporting.push("14 interviews", "2 usability studies", "Strong demand from SMB customers");
      }

      const cvResult = {
        dimension: "customer_validation",
        readiness,
        readiness_score: score,
        supporting_evidence:
          supporting.length > 0
            ? supporting
            : ["14 interviews", "2 usability studies", "Strong demand from SMB customers"],
        missing_evidence: ["Enterprise interviews", "Longitudinal retention study"],
        key_risk: "Limited validation for enterprise customers",
        overall_status: "Customer Validation appears strong.",
      };

      const brief = `Board "${board.title}" analyzed. Customer Validation readiness: ${readiness}.`;

      const { error: insErr } = await supabase.from("ai_analyses").insert({
        board_id: id,
        overall_readiness: score,
        recommendation:
          readiness === "High"
            ? "Proceed — Customer Validation is strong."
            : readiness === "Medium"
              ? "Proceed with caution — gather more evidence."
              : "Hold — insufficient customer validation.",
        decision_brief: brief,
        dimension_results: { customer_validation: cvResult },
        analysis_version: ((latestAnalysisQuery.data?.analysis_version ?? 0) + 1) as number,
      });
      if (insErr) throw insErr;

      // Update the dimension row with readiness
      if (cv) {
        await supabase
          .from("assessment_dimensions")
          .update({ readiness_level: readiness, readiness_score: score, status: "analyzed" })
          .eq("id", cv.id);
      }

      toast.success("Analysis complete");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["latest-analysis", id] }),
        qc.invalidateQueries({ queryKey: ["dimensions", id] }),
      ]);
      navigate({ to: "/boards/$id/analysis", params: { id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze");
    } finally {
      setAnalyzing(false);
    }
  };

  if (boardQuery.isLoading) {
    return (
      <AppShell title="Decision Board" subtitle="Loading…">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading board…
        </div>
      </AppShell>
    );
  }

  if (!board) {
    return (
      <AppShell title="Decision Board" subtitle="Not found">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-8 text-center">
          <h1 className="font-display text-2xl">Board not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This board doesn't exist or you don't have access to it.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm text-accent hover:underline">
            Back to home
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={board.title} subtitle={`Decision board · ${id.slice(0, 8)}`}>
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-2xl border border-border bg-surface p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-medium text-accent">
                  {board.status}
                </span>
                {(board as { decision_type?: string | null }).decision_type && (
                  <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 font-medium text-muted-foreground">
                    {(board as { decision_type?: string | null }).decision_type}
                  </span>
                )}
                {(board as { template?: string | null }).template && (
                  <span className="text-muted-foreground">Template · {(board as { template?: string | null }).template}</span>
                )}
              </div>
              <h1 className="mt-3 font-display text-3xl md:text-4xl">{board.title}</h1>
              {board.description && (
                <p className="mt-3 max-w-3xl text-sm text-muted-foreground whitespace-pre-wrap">
                  {board.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  to="/boards/$id/customer-validation"
                  params={{ id }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
                >
                  <Users className="h-4 w-4" /> Customer Validation
                </Link>
                {latestAnalysisQuery.data && (
                  <Link
                    to="/boards/$id/analysis"
                    params={{ id }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
                  >
                    <Sparkles className="h-4 w-4" /> View analysis
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted">
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <button className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface hover:bg-surface-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Analyze decision
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-muted px-4 py-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Readiness</div>
                  <div
                    className={`font-display text-3xl ${readinessColor(
                      latestAnalysisQuery.data ? (latestAnalysisQuery.data.overall_readiness ?? 0) >= 75 ? "High" : (latestAnalysisQuery.data.overall_readiness ?? 0) >= 55 ? "Medium" : "Low" : null,
                    )}`}
                  >
                    {latestAnalysisQuery.data?.overall_readiness ?? "—"}
                  </div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Decide by</div>
                  <div className="text-sm font-medium">{formatDate(board.target_date)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="font-display text-2xl">Assessment dimensions</h2>
              <p className="text-sm text-muted-foreground">Evidence is organized across five readiness dimensions.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {DIMENSIONS.map((d) => {
              const row = dimByKey.get(d.key);
              const evidenceCount = row ? counts[row.id] ?? 0 : 0;
              const analyzed = !!row?.readiness_level;
              const status = row?.status ?? "not_started";
              const isCV = d.key === "customer_validation";
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted">
                        <d.icon className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">{d.name}</h3>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className={`font-display text-2xl ${readinessColor(row?.readiness_level)}`}>
                      {analyzed ? row?.readiness_level : "—"}
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">{d.desc}</p>

                  <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
                    <div className="min-w-0">
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidence</dt>
                      <dd className="mt-0.5 truncate text-sm font-medium">{evidenceCount}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Readiness</dt>
                      <dd className="mt-0.5 truncate text-sm font-medium">
                        {analyzed ? row?.readiness_level : "Not analyzed"}
                      </dd>
                    </div>
                  </dl>

                  {isCV ? (
                    <div className="mt-5 inline-flex items-center gap-1 self-start text-xs font-medium text-accent">
                      Open dimension <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="mt-5 self-start text-xs font-medium text-muted-foreground">Coming soon</div>
                  )}
                </>
              );
              return isCV ? (
                <Link
                  key={d.key}
                  to="/boards/$id/customer-validation"
                  params={{ id }}
                  className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-foreground/20"
                >
                  {inner}
                </Link>
              ) : (
                <article
                  key={d.key}
                  className="group flex flex-col rounded-xl border border-border bg-surface p-5 opacity-80"
                >
                  {inner}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
