import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/decisions/$id_/outcome")({
  head: () => ({
    meta: [
      { title: "Capture Outcome — Axiora" },
      {
        name: "description",
        content:
          "Record what actually happened after the decision, so the reasoning can be checked against reality.",
      },
      { property: "og:title", content: "Capture Outcome — Axiora" },
      {
        property: "og:description",
        content: "Record what actually happened after the decision was made.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OutcomeCapture,
});

const OUTCOMES = [
  { value: "WORKED_OUT", label: "It Worked Out" },
  { value: "MIXED", label: "Mixed" },
  { value: "DIDNT_WORK_OUT", label: "It Didn't Work Out" },
  { value: "TOO_EARLY", label: "Too Early to Tell" },
] as const;

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15";

function OutcomeCapture() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [outcome, setOutcome] = useState("");
  const [note, setNote] = useState("");

  const query = useQuery({
    queryKey: ["outcome", id],
    queryFn: async () => {
      const [decision, existing] = await Promise.all([
        supabase
          .from("decisions")
          .select("id, title, final_choice, status")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("decision_outcomes")
          .select("*")
          .eq("decision_id", id)
          .maybeSingle(),
      ]);
      if (decision.error) throw decision.error;
      if (existing.error) throw existing.error;
      return { decision: decision.data, existing: existing.data };
    },
  });

  useEffect(() => {
    const existing = query.data?.existing;
    if (existing) {
      setOutcome(existing.outcome);
      setNote(existing.note ?? "");
    }
  }, [query.data?.existing]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("decision_outcomes")
        .upsert(
          { decision_id: id, outcome, note: note.trim() || null },
          { onConflict: "decision_id" },
        );
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["outcome", id] });
      toast.success("Outcome recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Capture Outcome">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          to="/decisions/$id"
          params={{ id }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to the briefing
        </Link>

        {query.isLoading && (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        )}

        {query.data?.decision && (
          <div className="mt-4">
            <h1 className="font-display text-2xl leading-snug">
              {query.data.decision.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Recorded decision: {query.data.decision.final_choice ?? "—"}
            </p>

            <div className="mt-6 space-y-5 rounded-xl border border-border bg-surface p-6">
              <div>
                <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  How did it turn out?
                </span>
                <div className="flex flex-wrap gap-2">
                  {OUTCOMES.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setOutcome(o.value)}
                      className={cn(
                        "rounded-md border px-3.5 py-2 text-sm",
                        outcome === o.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground/80 hover:bg-surface-muted",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  What actually happened? (optional)
                </span>
                <textarea
                  rows={4}
                  className={cn(inputClass, "resize-y")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What did you get right, and what did the evidence miss?"
                />
              </label>

              <button
                type="button"
                disabled={!outcome || save.isPending}
                onClick={() => save.mutate()}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Outcome
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
