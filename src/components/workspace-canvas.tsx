import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CircleDotDashed,
  CornerDownRight,
  GitBranch,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MODE_LABEL,
  MODE_OPENER,
  MODES,
  STATUS_LABEL,
  groupByWorkstream,
  type Mode,
  type WorkItem,
} from "@/lib/work";

type DecisionNode = {
  id: string;
  title: string;
  verdict: string;
  isDemo: boolean;
  workItemId?: string;
};

export function WorkspaceCanvas({
  items,
  decisions,
  busyId,
  onClarify,
  onCorrectMode,
  onBlockerResponse,
}: {
  items: WorkItem[];
  decisions: DecisionNode[];
  busyId: string | null;
  onClarify: (item: WorkItem, answer: string) => void;
  onCorrectMode: (item: WorkItem, mode: Mode) => void;
  onBlockerResponse: (item: WorkItem, confirmed: boolean) => void;
}) {
  const linkedDecisions = new Set(items.map((item) => item.decision_id).filter(Boolean));
  const standaloneDecisions = decisions.filter((decision) => !linkedDecisions.has(decision.id));
  const decisionItems: WorkItem[] = standaloneDecisions.map((decision) => ({
    id: `decision-${decision.id}`,
    raw_goal: decision.title,
    title: decision.title,
    description: null,
    workstream: "Decisions",
    status: "UNSCHEDULED",
    mode: "DECISION",
    steps: [],
    next_action: null,
    blocked_by: null,
    blocker_label: null,
    blocker_confirmed: null,
    clarifying_question: null,
    clarifying_options: [],
    clarifying_answer: null,
    ai_reasoning: decision.isDemo ? "Demo decision" : "Existing decision",
    user_corrections: [],
    decision_id: decision.id,
    created_at: "",
  }));
  const groups = groupByWorkstream([...items, ...decisionItems]);

  if (groups.length === 0) {
    return (
      <div className="mx-auto mt-10 max-w-md text-center">
        <CircleDotDashed className="mx-auto h-7 w-7 text-muted-foreground" />
        <h2 className="mt-3 font-display text-xl">Your workspace starts with a goal</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Tell Axiora what you are trying to accomplish. The right amount of structure will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-10" aria-label="Workspace">
      {groups.map(([workstream, group], groupIndex) => (
        <section key={workstream} className="relative">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {workstream}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div
            className={cn(
              "grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3",
              groupIndex % 2 === 1 && "md:pl-10 xl:pl-16",
            )}
          >
            {group.map((item, index) => (
              <WorkNode
                key={item.id}
                item={item}
                offset={index % 3}
                busy={busyId === item.id}
                onClarify={onClarify}
                onCorrectMode={onCorrectMode}
                onBlockerResponse={onBlockerResponse}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function WorkNode({
  item,
  offset,
  busy,
  onClarify,
  onCorrectMode,
  onBlockerResponse,
}: {
  item: WorkItem;
  offset: number;
  busy: boolean;
  onClarify: (item: WorkItem, answer: string) => void;
  onCorrectMode: (item: WorkItem, mode: Mode) => void;
  onBlockerResponse: (item: WorkItem, confirmed: boolean) => void;
}) {
  const [details, setDetails] = useState(item.mode === "AMBIGUOUS");
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [customAnswer, setCustomAnswer] = useState("");
  const prominent = item.status === "NOW" || item.status === "BLOCKED";

  return (
    <article
      className={cn(
        "work-node relative border bg-surface px-5 pb-5 pt-6 transition-all",
        prominent ? "min-h-52 border-primary/30 shadow-sm" : "min-h-44 border-border",
        item.status === "LATER" && "opacity-75",
        item.status === "COMPLETED" && "opacity-55",
        item.status === "BLOCKED" && "border-warning/60 bg-warning/5",
        offset === 1 && "md:mt-7",
        offset === 2 && "xl:mt-3",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            <span>{STATUS_LABEL[item.status]}</span>
            <span aria-hidden>·</span>
            <span>{MODE_LABEL[item.mode]}</span>
          </div>
          <h3 className={cn("mt-2 font-display leading-tight", prominent ? "text-xl" : "text-lg")}>
            {item.title}
          </h3>
        </div>
        {!item.id.startsWith("decision-") && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setCorrectionOpen((open) => !open)}
            aria-label={`Correct classification for ${item.title}`}
            title="Correct classification"
          >
            <MoreHorizontal />
          </Button>
        )}
      </div>

      {item.ai_reasoning && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground/70">Inference:</span> {item.ai_reasoning}
        </p>
      )}

      {correctionOpen && (
        <div className="mt-3 border-y border-border py-3">
          <p className="text-xs font-medium">Axiora got the mode wrong?</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MODES.filter((mode) => mode !== item.mode).map((mode) => (
              <Button
                key={mode}
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onCorrectMode(item, mode)}
              >
                {MODE_LABEL[mode]}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-sm leading-relaxed text-foreground/80">{MODE_OPENER[item.mode]}</p>

      {item.mode === "SIMPLE" && (
        <>
          {details && item.steps.length > 0 && (
            <ol className="mt-3 space-y-2 text-sm text-foreground/75">
              {item.steps.map((step, index) => (
                <li key={`${step}-${index}`} className="flex gap-2">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
          {item.next_action && (
            <div className="mt-4 flex items-start gap-2 border-t border-border pt-3 text-sm">
              <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <div><span className="text-xs font-semibold uppercase text-muted-foreground">Next</span><br />{item.next_action}</div>
            </div>
          )}
          {item.steps.length > 0 && (
            <Button type="button" variant="ghost" size="sm" className="mt-3 px-0" onClick={() => setDetails((open) => !open)}>
              {details ? "Hide steps" : "Show steps"}
            </Button>
          )}
        </>
      )}

      {item.mode === "AMBIGUOUS" && item.clarifying_question && (
        <div className="mt-4">
          <p className="font-medium leading-snug">{item.clarifying_question}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.clarifying_options.map((option) => (
              <Button key={option} type="button" variant="outline" size="sm" disabled={busy} onClick={() => onClarify(item, option)}>
                {option}
              </Button>
            ))}
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (customAnswer.trim()) onClarify(item, customAnswer.trim());
            }}
          >
            <input
              value={customAnswer}
              onChange={(event) => setCustomAnswer(event.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/20"
              placeholder="Something else"
              aria-label="Clarifying answer"
            />
            <Button type="submit" size="icon" disabled={!customAnswer.trim() || busy} aria-label="Submit answer">
              {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            </Button>
          </form>
        </div>
      )}

      {item.mode === "DEPENDENCY" && (
        <div className="mt-4">
          <div className="flex items-start gap-2 text-sm">
            <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p>
              <span className="font-medium">Possible blocker:</span>{" "}
              {item.blocker_label ?? "A prerequisite may need attention first."}
            </p>
          </div>
          {item.blocker_confirmed === null ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={busy} onClick={() => onBlockerResponse(item, true)}>
                <Check /> Confirm blocker
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onBlockerResponse(item, false)}>
                <X /> Not a blocker
              </Button>
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              {item.blocker_confirmed ? <Check className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
              {item.blocker_confirmed ? "Confirmed by you" : "Corrected by you"}
            </p>
          )}
        </div>
      )}

      {item.mode === "DECISION" && item.decision_id && (
        <Button asChild size="sm" className="mt-4">
          <Link to="/decisions/$id" params={{ id: item.decision_id }}>
            Open briefing <ArrowRight />
          </Link>
        </Button>
      )}

      {busy && item.mode !== "AMBIGUOUS" && (
        <span className="absolute bottom-4 right-5 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></span>
      )}
    </article>
  );
}

export function GoalInput({
  value,
  onChange,
  onSubmit,
  pending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  return (
    <form
      className="relative mx-auto max-w-3xl"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim() && !pending) onSubmit();
      }}
    >
      <div className="pointer-events-none absolute -inset-3 border border-border/70 workspace-input-frame" />
      <div className="relative flex items-center gap-3 border border-primary/20 bg-surface px-4 py-3 shadow-sm">
        <Sparkles className="h-5 w-5 shrink-0 text-accent" />
        <input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-muted-foreground sm:text-lg"
          placeholder="What are you trying to accomplish?"
          aria-label="What are you trying to accomplish?"
          maxLength={4000}
        />
        <Button type="submit" size="icon" disabled={!value.trim() || pending} aria-label="Let Axiora structure this">
          {pending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
        </Button>
      </div>
    </form>
  );
}