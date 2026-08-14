import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, FileText, Loader2, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ConfidenceChip, VerdictBadge } from "@/components/verdict-badge";
import { supabase } from "@/integrations/supabase/client";
import { computeAssessment, type EvidenceItem } from "@/lib/verdict";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Decisions — Axiora" },
      {
        name: "description",
        content:
          "Every launch decision you own, with the evidence you have, the evidence you're missing, and how confident you should be.",
      },
      { property: "og:title", content: "Your Decisions — Axiora" },
      {
        property: "og:description",
        content:
          "Evidence-grounded briefings for launch go/no-go decisions. No scores, no guessing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

type DecisionRow = {
  id: string;
  title: string;
  context: string | null;
  status: string;
  decide_by: string | null;
  decided_at: string | null;
  final_choice: string | null;
  is_demo: boolean;
  created_at: string;
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["decisions"],
    queryFn: async () => {
      const [decisions, evidence] = await Promise.all([
        supabase
          .from("decisions")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("evidence_items").select("*"),
      ]);
      if (decisions.error) throw decisions.error;
      if (evidence.error) throw evidence.error;
      const items = (evidence.data ?? []) as unknown as (EvidenceItem & {
        decision_id: string;
      })[];
      return ((decisions.data ?? []) as unknown as DecisionRow[]).map((d) => ({
        decision: d,
        assessment: computeAssessment(
          items.filter((e) => e.decision_id === d.id),
          { decided: d.status === "DECIDED" },
        ),
      }));
    },
  });

  return (
    <AppShell
      title="Your Decisions"
      subtitle="What you know, what you don't, and whether you can decide yet."
    >
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {data ? `${data.length} decision${data.length === 1 ? "" : "s"}` : " "}
          </p>
          <Link
            to="/decisions/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> New Decision
          </Link>
        </div>

        {isLoading && (
          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your decisions…
          </div>
        )}

        {error && (
          <p className="mt-10 text-sm text-destructive">
            {(error as Error).message}
          </p>
        )}

        {data && data.length === 0 && (
          <div className="mt-10 rounded-xl border border-dashed border-border bg-surface p-10 text-center">
            <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
            <h2 className="mt-3 font-display text-xl">No decisions yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Start with the launch call you're closest to. Axiora will show you
              what your evidence actually supports.
            </p>
            <Link
              to="/decisions/new"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Create Your First Decision
            </Link>
          </div>
        )}

        <ul className="mt-5 space-y-3">
          {data?.map(({ decision, assessment }) => (
            <li key={decision.id}>
              <Link
                to="/decisions/$id"
                params={{ id: decision.id }}
                className="group block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <VerdictBadge verdict={assessment.verdict} size="sm" />
                  <ConfidenceChip confidence={assessment.confidence} />
                  {decision.is_demo && (
                    <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      Demo
                    </span>
                  )}
                  <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5" />
                </div>

                <h2 className="mt-3 font-display text-xl leading-snug">
                  {decision.title}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  {assessment.total === 0
                    ? "No evidence yet"
                    : `${assessment.total} evidence item${assessment.total === 1 ? "" : "s"} · ${assessment.supporting.length} supporting · ${assessment.contradicting.length} contradicting`}
                  {decision.decide_by
                    ? ` · Decide by ${formatDate(decision.decide_by)}`
                    : ""}
                  {decision.decided_at
                    ? ` · Decided ${formatDate(decision.decided_at)}`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
