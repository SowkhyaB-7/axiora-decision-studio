import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowUpRight,
  Plus,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [{ title: "Home — Axiora" }],
  }),
  component: Home,
});

type BoardRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  analysis_status: string | null;
  decision_type: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
};

function statusTone(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "archived") return "bg-muted text-muted-foreground border-border";
  if (s === "decision recorded" || s === "decided")
    return "bg-success/10 text-success border-success/20";
  if (s === "in review") return "bg-info/10 text-info border-info/20";
  if (s === "blocked") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-accent/10 text-accent border-accent/20";
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

function Home() {
  const boardsQuery = useQuery({
    queryKey: ["boards", "mine"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [] as BoardRow[];
      const { data, error } = await supabase
        .from("decision_boards")
        .select("id, title, description, status, analysis_status, decision_type, target_date, created_at, updated_at")
        .eq("owner_id", uid)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BoardRow[];
    },
  });

  const boards = boardsQuery.data ?? [];
  const active = boards.filter((b) => (b.status || "").toLowerCase() !== "archived");
  const archivedCount = boards.length - active.length;

  return (
    <AppShell title="Home" subtitle="Overview of decision preparation across your organization">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Decision Intelligence
              </div>
              <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
                Your Decision Boards
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                Frame each decision, gather evidence across five dimensions, and let Axiora surface
                where you're ready and where you're not.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/boards/new"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> New Decision Board
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">Active Boards</div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 font-display text-3xl">{active.length}</div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">Archived</div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 font-display text-3xl">{archivedCount}</div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">Total Boards</div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 font-display text-3xl">{boards.length}</div>
          </div>
        </section>

        {/* Boards */}
        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold">Your Decision Boards</h2>
              <p className="text-xs text-muted-foreground">
                Most recently updated first.
              </p>
            </div>
          </div>

          {boardsQuery.isLoading ? (
            <div className="flex items-center gap-2 px-6 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading boards…
            </div>
          ) : boards.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-surface-muted">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-2xl">No Decision Boards Yet</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Create your first board to start organizing evidence and preparing your next
                  product decision.
                </p>
              </div>
              <Link
                to="/boards/new"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Create Your First Board
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {boards.map((b) => (
                <li key={b.id}>
                  <Link
                    to="/boards/$id"
                    params={{ id: b.id }}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 hover:bg-surface-muted"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{b.title}</span>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusTone(b.status)}`}
                        >
                          {b.status}
                        </span>
                        {b.decision_type && (
                          <span className="shrink-0 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {b.decision_type}
                          </span>
                        )}
                        {b.analysis_status && (
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                              b.analysis_status === "Analysis Complete"
                                ? "border-success/20 bg-success/10 text-success"
                                : "border-border bg-surface-muted text-muted-foreground"
                            }`}
                          >
                            {b.analysis_status}
                          </span>
                        )}
                      </div>
                      {b.description && (
                        <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {b.description}
                        </div>
                      )}
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Target · {formatDate(b.target_date)} · Created {formatDate(b.created_at)}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
