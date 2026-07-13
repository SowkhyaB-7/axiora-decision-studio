import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { DIMENSIONS, type DimensionKey } from "@/lib/dimensions";
import {
  analyzeDimension,
  overallConfidence,
  recommendationFor,
  type DimensionAnalysisResult,
} from "@/lib/analysis";
import { OutdatedAnalysisBanner } from "@/components/outdated-analysis-banner";
import {
  ArrowUpRight,
  Sparkles,
  Loader2,
  Pencil,
  Archive,
  Trash2,
  X,
} from "lucide-react";


export const Route = createFileRoute("/_authenticated/boards/$id")({
  head: () => ({
    meta: [{ title: "Decision Board — Axiora" }],
  }),
  component: BoardOverview,
});

/** Route path per dimension key — enables driving the cards from config. */
const DIMENSION_ROUTE = {
  customer_validation: "/boards/$id/customer-validation",
  product_technical: "/boards/$id/product-technical",
  business: "/boards/$id/business",
  operational: "/boards/$id/operational",
  stakeholder_alignment: "/boards/$id/stakeholder-alignment",
} as const satisfies Record<DimensionKey, string>;


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
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDecisionType, setEditDecisionType] = useState("Launch");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editStatus, setEditStatus] = useState("Draft");

  const openEdit = () => {
    if (!board) return;
    setEditTitle(board.title ?? "");
    setEditDescription(board.description ?? "");
    setEditDecisionType(
      (board as { decision_type?: string | null }).decision_type ?? "Launch",
    );
    setEditTargetDate(board.target_date ?? "");
    setEditStatus(board.status ?? "Draft");
    setEditOpen(true);
  };

  const invalidateBoards = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["board", id] }),
      qc.invalidateQueries({ queryKey: ["boards", "mine"] }),
    ]);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    setEditSaving(true);
    try {
      const { error } = await supabase
        .from("decision_boards")
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          decision_type: editDecisionType,
          target_date: editTargetDate || null,
          status: editStatus,
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("Board updated");
      setEditOpen(false);
      await invalidateBoards();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update board");
    } finally {
      setEditSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!board) return;
    const isArchived = (board.status ?? "").toLowerCase() === "archived";
    setArchiving(true);
    try {
      const { error } = await supabase
        .from("decision_boards")
        .update({ status: isArchived ? "Draft" : "Archived" })
        .eq("id", id);
      if (error) throw error;
      toast.success(isArchived ? "Board restored" : "Board archived");
      await invalidateBoards();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to archive");
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("decision_boards").delete().eq("id", id);
      if (error) throw error;
      toast.success("Board deleted");
      await invalidateBoards();
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
      setDeleting(false);
    }
  };

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
      const dimension_results: Record<string, DimensionAnalysisResult> = {};
      const scores: number[] = [];
      let totalEvidence = 0;

      for (const d of DIMENSIONS) {
        const row = dimByKey.get(d.key);
        let evidenceRows: {
          title: string;
          evidence_type: string | null;
          evidence_strength: string | null;
          evidence_date: string | null;
        }[] = [];
        if (row) {
          const { data: evRows } = await supabase
            .from("evidence")
            .select("title, evidence_type, evidence_strength, evidence_date")
            .eq("dimension_id", row.id);
          evidenceRows = evRows ?? [];
        }
        totalEvidence += evidenceRows.length;
        const result = analyzeDimension(d.key, evidenceRows);
        dimension_results[d.key] = result;
        scores.push(result.readiness_score);

        if (row) {
          await supabase
            .from("assessment_dimensions")
            .update({
              readiness_level: result.readiness,
              readiness_score: result.readiness_score,
              status: "analyzed",
            })
            .eq("id", row.id);
        }
      }

      const overall = Math.round(
        scores.reduce((a, b) => a + b, 0) / (scores.length || 1),
      );
      const brief = `Board "${board.title}" analyzed across ${DIMENSIONS.length} dimensions from ${totalEvidence} evidence item${totalEvidence === 1 ? "" : "s"}. Overall readiness: ${overall}.`;

      const { error: insErr } = await supabase.from("ai_analyses").insert({
        board_id: id,
        overall_readiness: overall,
        recommendation: recommendationFor(overall),
        decision_brief: brief,
        dimension_results,
        analysis_version: ((latestAnalysisQuery.data?.analysis_version ?? 0) + 1) as number,
      });
      if (insErr) throw insErr;

      // Persist analysis status on the board so it survives refresh and
      // shows consistently on dashboard + board list.
      await supabase
        .from("decision_boards")
        .update({ analysis_status: "Analysis Complete" } as never)
        .eq("id", id);

      toast.success("Analysis complete");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["latest-analysis", id] }),
        qc.invalidateQueries({ queryKey: ["dimensions", id] }),
        qc.invalidateQueries({ queryKey: ["board", id] }),
        qc.invalidateQueries({ queryKey: ["boards", "mine"] }),
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
                {(board as { analysis_status?: string | null }).analysis_status && (
                  <span
                    className={`rounded-full border px-2 py-0.5 font-medium ${
                      (board as { analysis_status?: string | null }).analysis_status ===
                      "Analysis Complete"
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-border bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    {(board as { analysis_status?: string | null }).analysis_status}
                  </span>
                )}
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

              {latestAnalysisQuery.data && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    to="/boards/$id/analysis"
                    params={{ id }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
                  >
                    <Sparkles className="h-4 w-4" /> View analysis
                  </Link>
                </div>
              )}

            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={openEdit}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={archiving}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted disabled:opacity-60"
                >
                  {archiving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                  {(board.status ?? "").toLowerCase() === "archived" ? "Restore" : "Archive"}
                </button>
                {(() => {
                  const neverAnalyzed = !latestAnalysisQuery.data;
                  const notRecorded =
                    (board.status ?? "").toLowerCase() !== "decision recorded";
                  const canDelete = neverAnalyzed && notRecorded;
                  const reason = !neverAnalyzed
                    ? "Cannot delete: this board has been analyzed"
                    : !notRecorded
                      ? "Cannot delete: decision already recorded"
                      : "";
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (!canDelete) {
                          toast.error(reason);
                          return;
                        }
                        setConfirmDelete(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  );
                })()}
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
                <div className="h-10 w-px bg-border" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Created</div>
                  <div className="text-sm font-medium">{formatDate(board.created_at)}</div>
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
              const to = DIMENSION_ROUTE[d.key];
              return (
                <Link
                  key={d.key}
                  to={to}
                  params={{ id }}
                  className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-foreground/20"
                >
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

                  <div className="mt-5 inline-flex items-center gap-1 self-start text-xs font-medium text-accent">
                    Open dimension <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}

          </div>
        </section>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Edit board</h2>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-surface-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Decision type</label>
                  <select
                    value={editDecisionType}
                    onChange={(e) => setEditDecisionType(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="Launch">Launch</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="Draft">Draft</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Decision Recorded">Decision Recorded</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Target date</label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {editSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h2 className="font-display text-2xl">Delete this board?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently delete the board and all its data. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete board
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

