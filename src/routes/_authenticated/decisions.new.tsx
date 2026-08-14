import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/decisions/new")({
  head: () => ({
    meta: [
      { title: "New Decision — Axiora" },
      {
        name: "description",
        content:
          "Frame the launch go/no-go decision you own, then let Axiora tell you what your evidence supports.",
      },
      { property: "og:title", content: "New Decision — Axiora" },
      {
        property: "og:description",
        content: "Frame a launch decision and gather the evidence behind it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewDecision,
});

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15";

function NewDecision() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [decideBy, setDecideBy] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("You're not signed in");
      const { data, error } = await supabase
        .from("decisions")
        .insert({
          owner_id: auth.user.id,
          title: title.trim(),
          context: context.trim() || null,
          decide_by: decideBy || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Decision created");
      navigate({ to: "/decisions/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't create the decision"),
  });

  const valid = title.trim().length >= 8;

  return (
    <AppShell
      title="New Decision"
      subtitle="One decision you personally own, framed as a question."
    >
      <div className="mx-auto w-full max-w-2xl">
        <form
          className="space-y-5 rounded-xl border border-border bg-surface p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) create.mutate();
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              The decision
            </span>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Should we launch the AI copilot to enterprise customers in Q3?"
            />
            <span className="mt-1.5 block text-xs text-muted-foreground">
              Write it as a question you can answer go or no-go.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Context (optional)
            </span>
            <textarea
              rows={4}
              className={`${inputClass} resize-y`}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="What's driving this decision, and what happens if you get it wrong?"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Decide by (optional)
            </span>
            <input
              type="date"
              className={inputClass}
              value={decideBy}
              onChange={(e) => setDecideBy(e.target.value)}
            />
          </label>

          <div className="flex items-center gap-3 border-t border-border pt-5">
            <button
              type="submit"
              disabled={!valid || create.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Decision
            </button>
            {!valid && (
              <span className="text-xs text-muted-foreground">
                Give the decision a clear title first.
              </span>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
