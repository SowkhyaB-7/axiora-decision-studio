import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Gavel,
  HelpCircle,
  Loader2,
  Plus,
  Scale,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EvidenceQuickAdd } from "@/components/evidence-quick-add";
import { ConfidenceChip, VerdictBadge } from "@/components/verdict-badge";
import { supabase } from "@/integrations/supabase/client";
import { getBriefing } from "@/lib/ai.functions";
import type { Briefing, BriefingClaim } from "@/lib/briefing";
import {
  CATEGORY_LABEL,
  DIRECTION_LABEL,
  STRENGTH_LABEL,
  VERDICT_LABEL,
  computeAssessment,
  type Category,
  type Direction,
  type EvidenceItem,
  type Strength,
} from "@/lib/verdict";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/decisions/$id")({
  head: () => ({
    meta: [
      { title: "Decision Briefing — Axiora" },
      {
        name: "description",
        content:
          "An evidence-grounded briefing: what your evidence supports, what contradicts it, what's missing, and whether you can decide yet.",
      },
      { property: "og:title", content: "Decision Briefing — Axiora" },
      {
        property: "og:description",
        content:
          "What your evidence supports, what contradicts it, and what's still missing.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DecisionBriefing,
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
};

type OverrideRow = {
  id: string;
  original_verdict: string;
  override_choice: string;
  reason: string;
  created_at: string;
};

const CHOICES = [
  { value: "GO", label: "Go" },
  { value: "NO_GO", label: "No-Go" },
  { value: "DEFER", label: "Defer" },
] as const;

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15";

function DecisionBriefing() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const runBriefing = useServerFn(getBriefing);
  const [adding, setAdding] = useState(false);
  const [highlight, setHighlight] = useState<number[]>([]);

  /** Links a briefing claim back to the exact stored evidence behind it. */
  const focusEvidence = (refs: number[]) => {
    setHighlight(refs);
    const first = document.getElementById(`evidence-${refs[0]}`);
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
  };


  const decisionQuery = useQuery({
    queryKey: ["decision", id],
    queryFn: async () => {
      const [decision, evidence, overrides] = await Promise.all([
        supabase.from("decisions").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("evidence_items")
          .select("*")
          .eq("decision_id", id)
          .order("ref", { ascending: true }),
        supabase
          .from("decision_overrides")
          .select("*")
          .eq("decision_id", id)
          .order("created_at", { ascending: false }),
      ]);
      if (decision.error) throw decision.error;
      if (evidence.error) throw evidence.error;
      if (overrides.error) throw overrides.error;
      return {
        decision: decision.data as unknown as DecisionRow | null,
        items: (evidence.data ?? []) as unknown as EvidenceItem[],
        overrides: (overrides.data ?? []) as unknown as OverrideRow[],
      };
    },
  });

  const items = decisionQuery.data?.items ?? [];
  const decision = decisionQuery.data?.decision ?? null;
  const decided = decision?.status === "DECIDED";
  const assessment = computeAssessment(items, { decided });

  const briefingQuery = useQuery({
    queryKey: ["briefing", id, items.map((e) => e.id).join(",")],
    enabled: !!decision,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => (await runBriefing({ data: { decisionId: id } })) as Briefing,
  });

  const removeEvidence = useMutation({
    mutationFn: async (evidenceId: string) => {
      const { error } = await supabase
        .from("evidence_items")
        .delete()
        .eq("id", evidenceId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["decision", id] });
      await qc.invalidateQueries({ queryKey: ["decisions"] });
      toast.success("Evidence removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (decisionQuery.isLoading) {
    return (
      <AppShell title="Decision Briefing">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading the briefing…
        </div>
      </AppShell>
    );
  }

  if (!decision) {
    return (
      <AppShell title="Decision Briefing">
        <p className="text-sm text-muted-foreground">
          This decision doesn't exist, or it isn't yours.{" "}
          <Link to="/dashboard" className="text-primary underline">
            Back to your decisions
          </Link>
        </p>
      </AppShell>
    );
  }

  const briefing = briefingQuery.data;

  return (
    <AppShell title="Decision Briefing">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Your Decisions
        </Link>

        <header className="mt-3 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <VerdictBadge verdict={assessment.verdict} />
            <ConfidenceChip confidence={assessment.confidence} />
            {decision.is_demo && (
              <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                Demo Decision
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl leading-tight">
            {decision.title}
          </h1>
          {decision.context && (
            <p className="mt-2 text-[15px] leading-relaxed text-foreground/80">
              {decision.context}
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {assessment.confidenceReason}
          </p>
        </header>

        {assessment.verdict === "INSUFFICIENT_EVIDENCE" && (
          <Callout
            tone="muted"
            icon={HelpCircle}
            title="Not Enough Evidence to Recommend Anything"
          >
            Axiora won't produce a verdict on this little evidence. Add evidence
            across customer, technical and business ground, then come back.
          </Callout>
        )}

        {assessment.isConflict && (
          <Callout tone="destructive" icon={Scale} title="Evidence Conflict">
            {briefing?.unresolved ??
              "Your evidence disagrees with itself. Axiora will not average these into a middle-ground answer — the disagreement has to be resolved."}
          </Callout>
        )}

        {/* Why Axiora says this */}
        <Section title="Why Axiora Says This">
          <ul className="space-y-1.5 text-[15px] leading-relaxed text-foreground/85">
            {assessment.ruleTrace.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                {line}
              </li>
            ))}
          </ul>

          {briefingQuery.isLoading && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading your evidence…
            </p>
          )}
          {briefingQuery.error && (
            <p className="mt-3 text-sm text-destructive">
              The reasoning summary couldn't be generated. The verdict above is
              still computed from your evidence.
            </p>
          )}
          {briefing && (
            <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">
              {briefing.why}
            </p>
          )}
          {briefing && !briefing.ai_generated && (
            <p className="mt-2 text-xs text-muted-foreground">
              Written from your stored evidence records without AI assistance.
            </p>
          )}
        </Section>

        {briefing && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ClaimList
              title="Argues For Going Ahead"
              claims={briefing.supports}
              emptyText="Nothing on record supports going ahead yet."
              onSelect={focusEvidence}
              activeRefs={highlight}
            />
            <ClaimList
              title="Argues Against Going Ahead"
              claims={briefing.contradicts}
              emptyText="No evidence on record argues against going ahead."
              onSelect={focusEvidence}
              activeRefs={highlight}
            />
          </div>
        )}

        {briefing && briefing.missing.length > 0 && (
          <Section title="What Would Change This">
            <ul className="space-y-1.5 text-[15px] leading-relaxed text-foreground/85">
              {briefing.missing.map((m) => (
                <li key={m} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
                  {m}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {briefing?.next_action && (
          <Section title="Next Action">
            <p className="text-[15px] leading-relaxed text-foreground/85">
              {briefing.next_action}
            </p>
          </Section>
        )}


        {/* Evidence */}
        <Section
          title={`Evidence (${items.length})`}
          action={
            !decided && !adding ? (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
              >
                <Plus className="h-4 w-4" /> Add Evidence
              </button>
            ) : null
          }
        >
          {adding && (
            <div className="mb-4">
              <EvidenceQuickAdd
                decisionId={id}
                onClose={() => setAdding(false)}
              />
            </div>
          )}

          {items.length === 0 && !adding && (
            <p className="text-sm text-muted-foreground">
              No evidence yet. Paste your first note to get started.
            </p>
          )}

          <ul className="space-y-3">
            {items.map((e) => (
              <EvidenceCard
                key={e.id}
                item={e}
                locked={decided}
                highlighted={highlight.includes(e.ref)}
                onDelete={() => removeEvidence.mutate(e.id)}
              />
            ))}
          </ul>

        </Section>

        {decisionQuery.data?.overrides.length ? (
          <Section title="Override Log">
            <ul className="space-y-3">
              {decisionQuery.data.overrides.map((o) => (
                <li
                  key={o.id}
                  className="rounded-lg border border-border bg-surface-muted/60 p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground">
                    <ShieldAlert className="h-4 w-4" />
                    Chose{" "}
                    <span className="font-medium text-foreground">
                      {CHOICES.find((c) => c.value === o.override_choice)?.label ??
                        o.override_choice}
                    </span>{" "}
                    while Axiora's read was{" "}
                    <span className="font-medium text-foreground">
                      {VERDICT_LABEL[o.original_verdict as keyof typeof VERDICT_LABEL] ??
                        o.original_verdict}
                    </span>
                    <span className="text-xs">
                      · {new Date(o.created_at).toISOString().slice(0, 10)}
                    </span>
                  </div>
                  <p className="mt-2 text-foreground/85">{o.reason}</p>

                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <DecideBlock
          decisionId={id}
          decided={decided}
          finalChoice={decision.final_choice}
          verdict={assessment.verdict}
          rawVerdict={computeAssessment(items).verdict}
          onDecided={async () => {
            await qc.invalidateQueries({ queryKey: ["decision", id] });
            await qc.invalidateQueries({ queryKey: ["decisions"] });
          }}
          onCapture={() => navigate({ to: "/decisions/$id/outcome", params: { id } })}
        />
      </div>
    </AppShell>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Callout({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: "muted" | "destructive";
  icon: typeof Scale;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-6 rounded-xl border p-5",
        tone === "destructive"
          ? "border-destructive/25 bg-destructive/5"
          : "border-border bg-surface-muted/60",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 font-medium",
          tone === "destructive" ? "text-destructive" : "text-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">
        {children}
      </p>
    </div>
  );
}

function ClaimList({
  title,
  claims,
  emptyText,
  onSelect,
  activeRefs,
}: {
  title: string;
  claims: BriefingClaim[];
  emptyText: string;
  onSelect: (refs: number[]) => void;
  activeRefs: number[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      {claims.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {claims.map((c) => {
            const active =
              c.evidence_refs.length > 0 &&
              c.evidence_refs.every((r) => activeRefs.includes(r)) &&
              activeRefs.length === c.evidence_refs.length;
            return (
              <li key={c.claim}>
                <button
                  type="button"
                  onClick={() => onSelect(c.evidence_refs)}
                  className={cn(
                    "-mx-2 block w-full rounded-md px-2 py-1 text-left text-[15px] leading-relaxed transition-colors hover:bg-surface-muted",
                    active && "bg-surface-muted",
                  )}
                  title="Show the evidence behind this"
                >
                  {c.claim}
                  <span className="ml-1.5 inline-flex gap-1 align-middle">
                    {c.evidence_refs.map((ref) => (
                      <span
                        key={ref}
                        className="rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                      >
                        #{ref}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


const DIRECTION_TONE: Record<Direction, string> = {
  SUPPORTS: "bg-success/10 text-success border-success/20",
  CONTRADICTS: "bg-destructive/10 text-destructive border-destructive/20",
  NEUTRAL: "bg-surface-muted text-muted-foreground border-border",
};

function EvidenceCard({
  item,
  locked,
  highlighted,
  onDelete,
}: {
  item: EvidenceItem;
  locked: boolean;
  highlighted?: boolean;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li
      id={`evidence-${item.ref}`}
      className={cn(
        "rounded-xl border bg-surface p-5 scroll-mt-24 transition-colors",
        highlighted
          ? "border-primary/50 ring-2 ring-primary/20"
          : "border-border",
      )}
    >

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded border border-border bg-surface-muted px-1.5 py-0.5 text-muted-foreground">
          #{item.ref}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
          {CATEGORY_LABEL[item.category as Category] ?? item.category}
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5",
            DIRECTION_TONE[item.direction as Direction],
          )}
        >
          {DIRECTION_LABEL[item.direction as Direction] ?? item.direction}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
          {STRENGTH_LABEL[item.strength as Strength] ?? item.strength}
        </span>
        {!locked && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto rounded p-1 text-muted-foreground hover:bg-surface-muted hover:text-destructive"
            aria-label={`Remove evidence ${item.ref}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <h3 className="mt-3 font-medium leading-snug">{item.title}</h3>
      {item.takeaway && (
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
          {item.takeaway}
        </p>
      )}

      {item.source_type === "DOCUMENT" && item.source_filename && (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span className="uppercase tracking-wide">Source</span>
          <span className="text-foreground/80">{item.source_filename}</span>
          {item.source_file_type && (
            <span className="rounded border border-border px-1.5 py-0.5">
              {item.source_file_type}
            </span>
          )}
          {item.source_storage_path && (
            <button
              type="button"
              onClick={async () => {
                const { data, error } = await supabase.storage
                  .from("evidence-attachments")
                  .createSignedUrl(item.source_storage_path!, 60);
                if (error || !data) {
                  toast.error("Couldn't open the original document");
                  return;
                }
                window.open(data.signedUrl, "_blank", "noopener");
              }}
              className="text-primary hover:underline"
            >
              Open original
            </button>
          )}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 text-xs text-primary hover:underline"
      >
        {open
          ? "Hide original text"
          : item.source_type === "DOCUMENT"
            ? "Show extracted text"
            : "Show original note"}
      </button>
      {open && (
        <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-surface-muted/60 p-3 text-sm leading-relaxed text-foreground/80">
          {item.raw_text}
        </p>
      )}
    </li>
  );
}

function DecideBlock({
  decisionId,
  decided,
  finalChoice,
  verdict,
  rawVerdict,
  onDecided,
  onCapture,
}: {
  decisionId: string;
  decided: boolean;
  finalChoice: string | null;
  verdict: string;
  rawVerdict: string;
  onDecided: () => Promise<void> | void;
  onCapture: () => void;
}) {
  const [choice, setChoice] = useState<string>("");
  const [reason, setReason] = useState("");

  // When Axiora's read is unresolved (conflicting or insufficient evidence),
  // ANY call the PM makes is theirs rather than the evidence's, so a reason is
  // recorded. Outside those states, only a "Go" against the evidence is.
  const unresolvedRead =
    rawVerdict === "EVIDENCE_CONFLICT" || rawVerdict === "INSUFFICIENT_EVIDENCE";
  const needsOverride =
    !!choice &&
    (unresolvedRead ||
      (choice === "GO" && rawVerdict !== "READY" && rawVerdict !== "ALMOST_READY"));


  const decide = useMutation({
    mutationFn: async () => {
      if (needsOverride) {
        const { error } = await supabase.from("decision_overrides").insert({
          decision_id: decisionId,
          original_verdict: rawVerdict,
          override_choice: choice,
          reason: reason.trim(),
        });
        if (error) throw error;
      }
      const { error } = await supabase
        .from("decisions")
        .update({
          status: "DECIDED",
          final_choice: choice,
          decided_at: new Date().toISOString(),
        })
        .eq("id", decisionId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await onDecided();
      toast.success("Decision recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (decided) {
    return (
      <div className="mt-8 rounded-xl border border-primary/25 bg-primary/5 p-5">
        <div className="flex items-center gap-2 font-medium text-primary">
          <Gavel className="h-4 w-4" />
          Decided:{" "}
          {CHOICES.find((c) => c.value === finalChoice)?.label ?? finalChoice}
        </div>
        <p className="mt-2 text-sm text-foreground/80">
          This decision is locked. Record what actually happened so the reasoning
          can be checked against reality.
        </p>
        <button
          type="button"
          onClick={onCapture}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Capture Outcome
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg">Mark Decided</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Axiora's read is{" "}
        <span className="font-medium text-foreground">
          {VERDICT_LABEL[verdict as keyof typeof VERDICT_LABEL] ?? verdict}
        </span>
        . The decision is still yours.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CHOICES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setChoice(c.value)}
            className={cn(
              "rounded-md border px-3.5 py-2 text-sm",
              choice === c.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-foreground/80 hover:bg-surface-muted",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {needsOverride && (
        <div className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <ShieldAlert className="h-4 w-4" /> Your call, not the evidence's
          </div>
          <p className="mt-1.5 text-sm text-foreground/80">
            {unresolvedRead
              ? "The evidence doesn't resolve this on its own. You can still decide, and your reasoning will be recorded alongside the decision."
              : "The evidence doesn't support going ahead. You can still choose Go, but your reasoning will be recorded alongside the decision."}
          </p>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you deciding this way, given the evidence?"
            className={cn(inputClass, "mt-3 resize-y")}

          />
        </div>
      )}

      <button
        type="button"
        disabled={
          !choice ||
          decide.isPending ||
          (needsOverride && reason.trim().length < 10)
        }
        onClick={() => decide.mutate()}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {decide.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Record Decision
      </button>
    </div>
  );
}
