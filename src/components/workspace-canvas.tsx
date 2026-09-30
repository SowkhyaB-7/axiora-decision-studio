import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CircleDotDashed,
  CornerDownRight,
  GitBranch,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  MODE_LABEL,
  MODE_OPENER,
  MODES,
  groupByWorkstream,
  type Mode,
  type WorkItem,
} from "@/lib/work";
import { deriveTiming, type TimingBucket } from "@/lib/deadline";
import { SupportingMaterials } from "@/components/supporting-materials";

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
  onEditGoal,
  onSetDeadline,
  onToggleComplete,
}: {
  items: WorkItem[];
  decisions: DecisionNode[];
  busyId: string | null;
  onClarify: (item: WorkItem, answer: string) => void;
  onCorrectMode: (item: WorkItem, mode: Mode) => void;
  onBlockerResponse: (item: WorkItem, confirmed: boolean) => void;
  onEditGoal: (item: WorkItem, goal: string) => Promise<unknown>;
  onSetDeadline: (item: WorkItem, date: string | null, time: string | null) => Promise<unknown>;
  onToggleComplete: (item: WorkItem) => Promise<unknown>;
}) {
  // Timing is derived from the clock, so re-evaluate as time passes.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60_000);
    window.addEventListener("focus", tick);
    return () => { window.clearInterval(id); window.removeEventListener("focus", tick); };
  }, []);
  // New or edited deadlines are read against the current moment, not the last tick.
  useEffect(() => { setNow(new Date()); }, [items]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeWorkstream, setActiveWorkstream] = useState<string | null>(null);
  const [timingFilter, setTimingFilter] = useState<TimingFilter>("ALL");
  const [view, setView] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DEFAULT");
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
    due_date: null,
    due_at: null,
    deadline_source: null,
    completed_at: null,
    created_at: "",
  }));
  const allItems = [...items, ...decisionItems];
  const groups = groupByWorkstream(allItems);
  const completedCount = allItems.filter((item) => item.status === "COMPLETED").length;
  const visibleGroups = (activeWorkstream
    ? groups.filter(([workstream]) => workstream === activeWorkstream)
    : groups
  )
    .map(([workstream, group]) => {
      // Finished work leaves the Active view; it lives under the Completed view.
      const filtered = group.filter((item) =>
        view === "COMPLETED"
          ? item.status === "COMPLETED"
          : item.status !== "COMPLETED" && (timingFilter === "ALL" || deriveTiming(item, now).bucket === timingFilter),
      );
      const ordered = sortOrder === "DEFAULT" ? filtered : sortByTiming(filtered, sortOrder, now);
      return [workstream, ordered] as [string, WorkItem[]];
    })
    .filter(([, group]) => group.length > 0);
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
        <div className="workspace-toolbar">
        <nav className="workspace-filters" aria-label="Filter by workstream">
          <Button
            type="button"
            variant={activeWorkstream === null ? "default" : "outline"}
            size="sm"
            className="workspace-filter"
            aria-pressed={activeWorkstream === null}
            onClick={() => setActiveWorkstream(null)}
          >
            All
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

        <div className="workspace-controls">
          <WorkspaceSelect
            label="Filter"
            ariaLabel="Filter by timing"
            value={timingFilter}
            onChange={(v) => setTimingFilter(v as TimingFilter)}
            options={TIMING_FILTERS}
          />
          <WorkspaceSelect
            label="Sort"
            ariaLabel="Sort by due date"
            value={sortOrder}
            onChange={(v) => setSortOrder(v as SortOrder)}
            options={[
              ["DEFAULT", "As organized"],
              ["EARLIEST", "Due date — earliest first"],
              ["LATEST", "Due date — latest first"],
            ]}
          />
        </div>
        </div>

        <div className={cn("workspace-map", activeWorkstream && "workspace-map-focused")} aria-label="Workspace">
          {visibleGroups.length === 0 && (
            <p className="workspace-empty">{timingFilter === "COMPLETED" ? "No completed work here yet." : "Nothing here matches this timing."}</p>
          )}
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
                    now={now}
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
          onEditGoal={onEditGoal}
          onSetDeadline={onSetDeadline}
          onToggleComplete={onToggleComplete}
          now={now}
        />
      )}
    </>
  );
}

function WorkspaceSelect({
  label,
  ariaLabel,
  value,
  onChange,
  options,
}: {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="workspace-control">
      <span>{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={ariaLabel} className="workspace-select-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="workspace-select-content">
          {options.map(([v, text]) => (
            <SelectItem key={v} value={v} className="workspace-select-item">
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function WorkNode({
  item,
  verdict,
  now,
  onOpen,
}: {
  item: WorkItem;
  verdict?: string;
  now: Date;
  onOpen: () => void;
}) {
  const bucket = deriveTiming(item, now).bucket;
  const prominent = bucket === "OVERDUE" || bucket === "SOON" || item.status === "BLOCKED" || item.mode === "AMBIGUOUS";
  const summary = getNodeSummary(item, verdict);
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase text-muted-foreground">
          <span className={cn("workspace-node-mark", `workspace-node-mark-${item.mode.toLowerCase()}`)} />
          <span className="truncate">{nodeStateLabel(item, now)}</span>
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
    bucket === "LATER" && "workspace-node-later",
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
  onEditGoal,
  onSetDeadline,
  onToggleComplete,
  now,
}: {
  item: WorkItem;
  busy: boolean;
  now: Date;
  onEditGoal: (item: WorkItem, goal: string) => Promise<unknown>;
  onSetDeadline: (item: WorkItem, date: string | null, time: string | null) => Promise<unknown>;
  onToggleComplete: (item: WorkItem) => Promise<unknown>;
  onClose: () => void;
  onClarify: (item: WorkItem, answer: string) => void;
  onCorrectMode: (item: WorkItem, mode: Mode) => void;
  onBlockerResponse: (item: WorkItem, confirmed: boolean) => void;
}) {
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [customAnswer, setCustomAnswer] = useState("");
  const [editing, setEditing] = useState(false);
  const [draftGoal, setDraftGoal] = useState(item.raw_goal);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const currentTime = item.due_at
    ? new Date(item.due_at).toTimeString().slice(0, 5)
    : "";
  const [draftDate, setDraftDate] = useState(item.due_date ?? "");
  const [draftTime, setDraftTime] = useState(currentTime);
  const timing = deriveTiming(item, now);

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
              {item.workstream} · {nodeStateLabel(item, now)}
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
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">What you told me</p>
              {!editing && (
                <Button type="button" variant="ghost" size="sm" className="h-auto px-0 py-0 text-xs" disabled={busy} onClick={() => { setDraftGoal(item.raw_goal); setEditing(true); }}>
                  <Pencil /> Edit
                </Button>
              )}
            </div>
            {editing ? (
              <form
                className="mt-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const next = draftGoal.trim();
                  if (next.length < 3) return;
                  if (next === item.raw_goal.trim()) return setEditing(false);
                  try { await onEditGoal(item, next); setEditing(false); } catch { /* toast shown */ }
                }}
              >
                <textarea
                  value={draftGoal}
                  onChange={(event) => setDraftGoal(event.target.value)}
                  rows={3}
                  maxLength={4000}
                  autoFocus
                  aria-label="Edit your request"
                  className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/20"
                />
                <p className="mt-1 text-xs text-muted-foreground">Axiora will re-read your request and update the rest.</p>
                <div className="mt-2 flex gap-2">
                  <Button type="submit" size="sm" disabled={busy || draftGoal.trim().length < 3}>
                    {busy ? <Loader2 className="animate-spin" /> : <Check />} Save
                  </Button>
                  <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-foreground">“{item.raw_goal}”</p>
            )}
            {item.clarifying_answer && (
              <p className="mt-1 text-sm leading-relaxed text-foreground">Your answer: {item.clarifying_answer}</p>
            )}
            {editingDeadline ? (
              <form
                className="mt-2 flex flex-wrap items-center gap-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!draftDate) return;
                  await onSetDeadline(item, draftDate, draftTime || null);
                  setEditingDeadline(false);
                }}
              >
                <input type="date" value={draftDate} onChange={(e) => setDraftDate(e.target.value)} aria-label="Deadline date" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                <input type="time" value={draftTime} onChange={(e) => setDraftTime(e.target.value)} aria-label="Deadline time (optional)" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                <Button type="submit" size="sm" disabled={busy || !draftDate}>Save</Button>
                {item.due_date && (
                  <Button type="button" size="sm" variant="outline" disabled={busy} onClick={async () => { await onSetDeadline(item, null, null); setEditingDeadline(false); }}>
                    Remove deadline
                  </Button>
                )}
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingDeadline(false)}>Cancel</Button>
              </form>
            ) : (
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {item.due_date
                    ? `${timing.bucket === "COMPLETED" ? "Deadline was" : timing.label + " ·"} ${new Date(item.due_at ?? `${item.due_date}T00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}${item.due_at ? `, ${new Date(item.due_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}${item.deadline_source === "USER" ? " (set by you)" : ""}`
                    : "No deadline given"}
                </span>
                <Button type="button" variant="ghost" size="sm" className="h-auto px-0 py-0 text-xs" disabled={busy} onClick={() => { setDraftDate(item.due_date ?? ""); setDraftTime(currentTime); setEditingDeadline(true); }}>
                  {item.due_date ? "Change" : "Add deadline"}
                </Button>
              </p>
            )}
          </div>
          {item.ai_reasoning && (
            <div className="mt-5 bg-surface-muted p-4">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">What I’m inferring</p>
              <p className="mt-2 text-sm italic leading-relaxed text-foreground/75">{item.ai_reasoning}</p>
            </div>
          )}
        </div>

        {item.mode === "SIMPLE" && (
          <div className="mt-8 space-y-7">
            {item.steps.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase text-muted-foreground">Suggested approach · adjust as needed</p>
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
                <span className="font-medium">Possible blocker (my inference, please confirm):</span>{" "}
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

        <SupportingMaterials workItemId={item.id} />

        <div className="mt-10 border-t border-border pt-5">
          <Button type="button" variant="outline" size="sm" className="mb-3" disabled={busy} onClick={() => onToggleComplete(item)}>
            {item.status === "COMPLETED" ? <><RotateCcw /> Reopen</> : <><Check /> Mark as completed</>}
          </Button>
          {item.status === "COMPLETED" && (
            <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5" /> Completed{item.completed_at ? ` ${formatCompleted(item.completed_at)}` : ""}
            </p>
          )}
          <br />
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

type TimingFilter = "ALL" | TimingBucket;
type SortOrder = "DEFAULT" | "EARLIEST" | "LATEST";

const TIMING_FILTERS: [TimingFilter, string][] = [
  ["ALL", "All timing"],
  ["OVERDUE", "Overdue"],
  ["SOON", "Due soon"],
  ["WEEK", "Due this week"],
  ["LATER", "Due later"],
  ["NONE", "No deadline"],
  ["COMPLETED", "Completed"],
];

// Undated and completed work keeps its place at the end; dated work sorts by its real deadline.
function sortByTiming(group: WorkItem[], order: Exclude<SortOrder, "DEFAULT">, now: Date) {
  const rank = (item: WorkItem) => deriveTiming(item, now).rank;
  const dated = group.filter((item) => rank(item) !== null);
  const undated = group.filter((item) => rank(item) === null);
  dated.sort((a, b) => (order === "EARLIEST" ? rank(a)! - rank(b)! : rank(b)! - rank(a)!));
  return [...dated, ...undated];
}

function formatCompleted(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function nodeStateLabel(item: WorkItem, now: Date) {
  if (item.status === "COMPLETED") return item.completed_at ? `Completed ${formatCompleted(item.completed_at)}` : "Completed";
  if (item.mode === "AMBIGUOUS") return "I need your input";
  if (item.mode === "DECISION") return "A decision to make";
  if (item.mode === "DEPENDENCY" && item.blocker_confirmed !== true) return "Possible hold-up";
  if (item.status === "BLOCKED" || item.blocker_confirmed === true) return "Waiting on…";
  return deriveTiming(item, now).label;
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