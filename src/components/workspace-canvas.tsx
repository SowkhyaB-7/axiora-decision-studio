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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeWorkstream, setActiveWorkstream] = useState<string | null>(null);
  const linkedDecisions = new Set(items.map((item) => item.decision_id).filter(Boolean));
  const decisionVerdicts = new Map(decisions.map((decision) => [decision.id, decision.verdict]));
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
  const allItems = [...items, ...decisionItems];
  const groups = groupByWorkstream(allItems);
  const visibleGroups = activeWorkstream
    ? groups.filter(([workstream]) => workstream === activeWorkstream)
    : groups;
  const selectedItem = allItems.find((item) => item.id === selectedId) ?? null;

  if (groups.length === 0) {
    return (
      <div className="mx-auto mt-12 max-w-md text-center">
        <CircleDotDashed className="mx-auto h-7 w-7 text-muted-foreground" />
        <h2 className="mt-3 font-display text-xl">Your workspace starts with a goal</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Tell Axiora what you are trying to accomplish. The right amount of structure will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="workspace-surface mt-8">
        <nav className="workspace-filters" aria-label="Filter by workstream">
          <Button
            type="button"
            variant={activeWorkstream === null ? "default" : "outline"}
            size="sm"
            className="workspace-filter"
            aria-pressed={activeWorkstream === null}
            onClick={() => setActiveWorkstream(null)}
          >
            All work
          </Button>
          {groups.map(([workstream]) => (
            <Button
              key={workstream}
              type="button"
              variant={activeWorkstream === workstream ? "default" : "outline"}
              size="sm"
              className="workspace-filter"
              aria-pressed={activeWorkstream === workstream}
              onClick={() => setActiveWorkstream(workstream)}
            >
              {workstream}
            </Button>
          ))}
        </nav>

        <div className="workspace-map" aria-label="Workspace">
          {visibleGroups.map(([workstream, group]) => (
            <section key={workstream} className="workspace-cluster">
              <div className="workspace-cluster-heading">
                <span>{workstream}</span>
                <span>{group.length} {group.length === 1 ? "piece of work" : "pieces of work"}</span>
              </div>
              <div className="workspace-cluster-nodes">
                {group.map((item) => (
                  <WorkNode
                    key={item.id}
                    item={item}
                    verdict={item.decision_id ? decisionVerdicts.get(item.decision_id) : undefined}
                    onOpen={() => setSelectedId(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {selectedItem && selectedItem.mode !== "DECISION" && (
        <WorkDetail
          item={selectedItem}
          busy={busyId === selectedItem.id}
          onClose={() => setSelectedId(null)}
          onClarify={onClarify}
          onCorrectMode={onCorrectMode}
          onBlockerResponse={onBlockerResponse}
        />
      )}
    </>
  );
}

function WorkNode({
  item,
  verdict,
  onOpen,
}: {
  item: WorkItem;
  verdict?: string;
  onOpen: () => void;
}) {
  const prominent = item.status === "NOW" || item.status === "BLOCKED" || item.mode === "AMBIGUOUS";
  const summary = getNodeSummary(item, verdict);
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase text-muted-foreground">
          <span className={cn("workspace-node-mark", `workspace-node-mark-${item.mode.toLowerCase()}`)} />
          <span className="truncate">{nodeStateLabel(item)}</span>
        </div>
        {item.mode !== "DECISION" && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      </div>
      <h3 className={cn("mt-2 line-clamp-2 font-display leading-tight", prominent ? "text-lg" : "text-base")}>
        {item.title}
      </h3>
      {summary && (
        <p className="mt-2 line-clamp-1 text-xs leading-relaxed text-muted-foreground">{summary}</p>
      )}
    </>
  );

  const nodeClass = cn(
    "workspace-node block w-full text-left",
    prominent && "workspace-node-prominent",
    item.mode === "DECISION" && "workspace-node-decision",
    item.mode === "AMBIGUOUS" && "workspace-node-input",
    item.status === "BLOCKED" && "workspace-node-blocked",
    item.status === "LATER" && "workspace-node-later",
    item.status === "COMPLETED" && "workspace-node-completed",
  );

  if (item.mode === "DECISION" && item.decision_id) {
    return (
      <Button asChild variant="ghost" className={nodeClass}>
        <Link to="/decisions/$id" params={{ id: item.decision_id }}>
          <span>{content}</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button type="button" variant="ghost" className={nodeClass} onClick={onOpen}>
      <span>{content}</span>
    </Button>
  );
}

function WorkDetail({
  item,
  busy,
  onClose,
  onClarify,
  onCorrectMode,
  onBlockerResponse,
}: {
  item: WorkItem;
  busy: boolean;
  onClose: () => void;
  onClarify: (item: WorkItem, answer: string) => void;
  onCorrectMode: (item: WorkItem, mode: Mode) => void;
  onBlockerResponse: (item: WorkItem, confirmed: boolean) => void;
}) {
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [customAnswer, setCustomAnswer] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/15" role="presentation">
      <aside
        className="workspace-detail h-full w-full overflow-y-auto border-l border-border bg-background p-5 shadow-xl sm:max-w-lg sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="work-detail-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">
              {item.workstream} · {nodeStateLabel(item)}
            </p>
            <h2 id="work-detail-title" className="mt-2 font-display text-3xl leading-tight">
              {item.title}
            </h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close work details">
            <X />
          </Button>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm leading-relaxed text-foreground/80">{MODE_OPENER[item.mode]}</p>
          {item.ai_reasoning && (
            <div className="mt-5 bg-surface-muted p-4">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">Axiora’s interpretation</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">{item.ai_reasoning}</p>
            </div>
          )}
        </div>

        {item.mode === "SIMPLE" && (
          <div className="mt-8 space-y-7">
            {item.steps.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">Proposed approach</p>
                <ol className="mt-3 space-y-3 text-sm text-foreground/80">
                  {item.steps.map((step, index) => (
                    <li key={`${step}-${index}`} className="flex gap-3">
                      <span className="text-muted-foreground">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {item.next_action && (
              <div className="flex items-start gap-3 border-t border-border pt-5 text-sm">
                <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground">Suggested next</span>
                  <p className="mt-1 leading-relaxed">{item.next_action}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {item.mode === "AMBIGUOUS" && item.clarifying_question && (
          <div className="mt-8">
            <p className="font-display text-xl leading-snug">{item.clarifying_question}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.clarifying_options.map((option) => (
                <Button key={option} type="button" variant="outline" size="sm" disabled={busy} onClick={() => onClarify(item, option)}>
                  {option}
                </Button>
              ))}
            </div>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (customAnswer.trim()) onClarify(item, customAnswer.trim());
              }}
            >
              <input
                value={customAnswer}
                onChange={(event) => setCustomAnswer(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20"
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
          <div className="mt-8 border-l-2 border-warning pl-4">
            <div className="flex items-start gap-2 text-sm">
              <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p>
                <span className="font-medium">Possible blocker:</span>{" "}
                {item.blocker_label ?? "A prerequisite may need attention first."}
              </p>
            </div>
            {item.blocker_confirmed === null ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" disabled={busy} onClick={() => onBlockerResponse(item, true)}>
                  <Check /> Confirm blocker
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onBlockerResponse(item, false)}>
                  <X /> Not a blocker
                </Button>
              </div>
            ) : (
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                {item.blocker_confirmed ? <Check className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                {item.blocker_confirmed ? "Confirmed by you" : "Corrected by you"}
              </p>
            )}
          </div>
        )}

        <div className="mt-10 border-t border-border pt-5">
          <Button type="button" variant="ghost" size="sm" className="px-0" onClick={() => setCorrectionOpen((open) => !open)}>
            <MoreHorizontal /> Correct interpretation
          </Button>
          {correctionOpen && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Choose the interpretation that better fits this work.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {MODES.filter((mode) => mode !== item.mode).map((mode) => (
                  <Button key={mode} type="button" size="sm" variant="outline" disabled={busy} onClick={() => onCorrectMode(item, mode)}>
                    {MODE_LABEL[mode]}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function nodeStateLabel(item: WorkItem) {
  if (item.mode === "AMBIGUOUS") return "I need your input";
  if (item.mode === "DECISION") return "A decision to make";
  if (item.mode === "DEPENDENCY" && item.blocker_confirmed !== true) return "Possible hold-up";
  if (item.status === "BLOCKED" || item.blocker_confirmed === true) return "Waiting on…";
  if (item.status === "COMPLETED") return "Completed";

  const timing = explicitTimingLabel(item.raw_goal);
  if (timing) return timing;
  if (item.status === "NOW") return "Due soon";
  if (item.status === "NEXT") return "Coming up";
  if (item.status === "LATER") return "Later";
  return "No deadline";
}

function explicitTimingLabel(goal: string) {
  const normalized = goal.toLowerCase();
  const weekday = normalized.match(/\b(?:by|before|on|this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (weekday?.[1]) return `Due ${titleCase(weekday[1])}`;
  if (/\btomorrow\b/i.test(normalized)) return "Due tomorrow";
  if (/\btoday\b/i.test(normalized)) return "Due today";
  if (/\bnext month\b/i.test(normalized)) return "Next month";
  if (/\blater this month\b/i.test(normalized)) return "Later this month";
  if (/\bthis week\b/i.test(normalized)) return "Due this week";
  if (/\bnext week\b/i.test(normalized)) return "Next week";
  return null;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function getNodeSummary(item: WorkItem, verdict?: string) {
  if (item.mode === "AMBIGUOUS") return item.clarifying_question ?? "Axiora needs one answer before structuring this work.";
  if (item.mode === "DEPENDENCY") return item.blocker_label ?? "A prerequisite may need attention first.";
  if (item.mode === "DECISION") return verdict ? `Briefing · ${verdict}` : "Open the decision briefing";
  return item.next_action ?? item.description;
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
      <div className="relative flex items-center gap-3 border border-primary/20 bg-surface px-4 py-3 shadow-sm ring-4 ring-border/30">
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