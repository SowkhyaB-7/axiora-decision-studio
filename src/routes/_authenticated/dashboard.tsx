import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { GoalInput, WorkspaceCanvas } from "@/components/workspace-canvas";
import { supabase } from "@/integrations/supabase/client";
import { parseDeadline, toInstant, toISODate } from "@/lib/deadline";
import { clarifyWorkItem, correctWorkItemMode, editWorkItemGoal, interpretGoal } from "@/lib/ai.functions";
import { computeAssessment, VERDICT_LABEL, type EvidenceItem } from "@/lib/verdict";
import { toWorkItem, type Mode, type WorkItem } from "@/lib/work";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Workspace — Axiora" },
      {
        name: "description",
        content:
          "Turn an unstructured goal into the right next action, clarification, dependency, or evidence-grounded decision.",
      },
      { property: "og:title", content: "Workspace — Axiora" },
      {
        property: "og:description",
        content: "An intelligent workspace for work that is not neatly structured yet.",
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
  status: string;
  is_demo: boolean;
};

function Home() {
  const queryClient = useQueryClient();
  const runInterpret = useServerFn(interpretGoal);
  const runClarify = useServerFn(clarifyWorkItem);
  const runCorrection = useServerFn(correctWorkItemMode);
  const runEdit = useServerFn(editWorkItemGoal);
  const [goal, setGoal] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const workspace = useQuery({
    queryKey: ["workspace"],
    queryFn: async () => {
      const [work, decisions, evidence] = await Promise.all([
        supabase.from("work_items").select("*").order("created_at", { ascending: false }),
        supabase.from("decisions").select("id, title, status, is_demo"),
        supabase.from("evidence_items").select("*"),
      ]);
      if (work.error) throw work.error;
      // One-time recovery for items saved before deadlines were stored: read explicit
      // dates from the original words relative to the day the item was added.
      const legacy = (work.data ?? []).filter((row) => !row.deadline_checked);
      for (const row of legacy) {
        const patch = deadlineFromGoal(row.raw_goal, new Date(row.created_at));
        await supabase.from("work_items").update(patch).eq("id", row.id);
        Object.assign(row, patch);
      }
      if (decisions.error) throw decisions.error;
      if (evidence.error) throw evidence.error;
      const evidenceRows = (evidence.data ?? []) as unknown as (EvidenceItem & {
        decision_id: string;
      })[];
      return {
        items: (work.data ?? []).map((row) => toWorkItem(row as unknown as Record<string, unknown>)),
        decisions: ((decisions.data ?? []) as DecisionRow[]).map((decision) => ({
          id: decision.id,
          title: decision.title,
          isDemo: decision.is_demo,
          verdict: VERDICT_LABEL[
            computeAssessment(
              evidenceRows.filter((item) => item.decision_id === decision.id),
              { decided: decision.status === "DECIDED" },
            ).verdict
          ],
        })),
      };
    },
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["workspace"] }),
      queryClient.invalidateQueries({ queryKey: ["decisions"] }),
    ]);
  };

  const create = useMutation({
    mutationFn: async () => runInterpret({ data: { goal: goal.trim() } }),
    onSuccess: async (row) => {
      setGoal("");
      await supabase.from("work_items").update(deadlineFromGoal(row.raw_goal, new Date())).eq("id", row.id);
      await refresh();
      const item = toWorkItem(row as unknown as Record<string, unknown>);
      toast.success(
        item.mode === "AMBIGUOUS"
          ? "Axiora has one question"
          : item.mode === "DECISION"
            ? "Decision opened"
            : "Added to your workspace",
      );
    },
    onError: (error: Error) => toast.error(error.message || "Axiora couldn't interpret that goal"),
  });

  const clarify = useMutation({
    mutationFn: async ({ item, answer }: { item: WorkItem; answer: string }) => {
      setBusyId(item.id);
      return runClarify({ data: { itemId: item.id, answer } });
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Work clarified");
    },
    onError: (error: Error) => toast.error(error.message || "Couldn't clarify that work"),
    onSettled: () => setBusyId(null),
  });

  const edit = useMutation({
    mutationFn: async ({ item, goal }: { item: WorkItem; goal: string }) => {
      setBusyId(item.id);
      const row = await runEdit({ data: { itemId: item.id, goal } });
      // A date the user set by hand is never overwritten by re-reading the words.
      if (row.deadline_source !== "USER") {
        await supabase.from("work_items").update(deadlineFromGoal(goal, new Date())).eq("id", item.id);
      }
      return row;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Request updated");
    },
    onError: (error: Error) => toast.error(error.message || "Couldn't update that request"),
    onSettled: () => setBusyId(null),
  });

  const correct = useMutation({
    mutationFn: async ({ item, mode }: { item: WorkItem; mode: Mode }) => {
      setBusyId(item.id);
      return runCorrection({ data: { itemId: item.id, mode } });
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Correction saved");
    },
    onError: (error: Error) => toast.error(error.message || "Couldn't save that correction"),
    onSettled: () => setBusyId(null),
  });

  const updateItem = async (item: WorkItem, patch: Record<string, unknown>, message: string) => {
    setBusyId(item.id);
    const { error } = await supabase.from("work_items").update(patch).eq("id", item.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success(message);
  };

  const setDeadline = (item: WorkItem, date: string | null, time: string | null) =>
    updateItem(
      item,
      {
        due_date: date,
        due_at: date && time ? toInstant(date, time, new Date(`${date}T${time}`).getTimezoneOffset()) : null,
        deadline_source: date ? "USER" : null,
        deadline_checked: true,
        user_corrections: [
          ...item.user_corrections,
          { from: item.due_date ?? "no deadline", to: date ? `${date}${time ? ` ${time}` : ""}` : "no deadline", at: new Date().toISOString() },
        ],
      },
      date ? "Deadline updated" : "Deadline removed",
    );

  const toggleComplete = (item: WorkItem) =>
    updateItem(
      item,
      { status: item.status === "COMPLETED" ? (item.mode === "DEPENDENCY" && item.blocker_confirmed ? "BLOCKED" : "UNSCHEDULED") : "COMPLETED" },
      item.status === "COMPLETED" ? "Reopened" : "Marked complete",
    );

  const respondToBlocker = async (item: WorkItem, confirmed: boolean) => {
    setBusyId(item.id);
    const corrections = [
      ...item.user_corrections,
      {
        from: "possible blocker",
        to: confirmed ? "confirmed blocker" : "not a blocker",
        at: new Date().toISOString(),
      },
    ];
    const { error } = await supabase
      .from("work_items")
      .update({
        blocker_confirmed: confirmed,
        status: confirmed ? "BLOCKED" : "UNSCHEDULED",
        mode: confirmed ? "DEPENDENCY" : "SIMPLE",
        user_corrections: corrections,
      })
      .eq("id", item.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success(confirmed ? "Blocker confirmed" : "Correction saved");
  };

  return (
    <AppShell
      title="Workspace"
      subtitle="Start with what you are trying to accomplish."
    >
      <div className="mx-auto w-full max-w-6xl">
        <header className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Axiora Workspace
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
            Bring the work before the structure
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Describe the outcome in your own words. Axiora will keep simple work simple, ask when context is missing, and surface decisions or dependencies when they matter.
          </p>
        </header>

        <GoalInput
          value={goal}
          onChange={setGoal}
          onSubmit={() => create.mutate()}
          pending={create.isPending}
        />

        {workspace.isLoading && (
          <div className="mt-14 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Gathering your workspace…
          </div>
        )}

        {workspace.error && (
          <p className="mt-10 text-center text-sm text-destructive">
            {(workspace.error as Error).message}
          </p>
        )}

        {workspace.data && (
          <WorkspaceCanvas
            items={workspace.data.items}
            decisions={workspace.data.decisions}
            busyId={busyId}
            onClarify={(item, answer) => clarify.mutate({ item, answer })}
            onCorrectMode={(item, mode) => correct.mutate({ item, mode })}
            onEditGoal={(item, goal) => edit.mutateAsync({ item, goal })}
            onBlockerResponse={respondToBlocker}
            onSetDeadline={setDeadline}
            onToggleComplete={toggleComplete}
          />
        )}
      </div>
    </AppShell>
  );
}
/** Explicit deadlines only; reference is the local day the words were written. */
function deadlineFromGoal(goal: string, reference: Date) {
  const refISO = toISODate(reference);
  const parsed = parseDeadline(goal, refISO);
  return {
    due_date: parsed?.date ?? null,
    due_at: parsed?.time ? toInstant(parsed.date, parsed.time, new Date(`${parsed.date}T${parsed.time}`).getTimezoneOffset()) : null,
    deadline_source: parsed ? ("GOAL" as const) : null,
    deadline_checked: true,
  };
}
