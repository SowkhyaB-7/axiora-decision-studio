/**
 * Work item model shared by the workspace surfaces.
 *
 * Axiora classifies a messy goal into one of four modes. The mode decides how
 * much structure is shown, never how much is stored: every item carries the
 * same shape so the intelligence layer stays coherent.
 */

export const MODES = ["SIMPLE", "AMBIGUOUS", "DEPENDENCY", "DECISION"] as const;
export type Mode = (typeof MODES)[number];

export const STATUSES = ["UNSCHEDULED", "NOW", "NEXT", "LATER", "BLOCKED", "COMPLETED"] as const;
export type Status = (typeof STATUSES)[number];

export const URGENCIES = ["UNSCHEDULED", "NOW", "NEXT", "LATER"] as const;
export type Urgency = (typeof URGENCIES)[number];

export const MODE_LABEL: Record<Mode, string> = {
  SIMPLE: "Task",
  AMBIGUOUS: "Needs Clarifying",
  DEPENDENCY: "Possibly Blocked",
  DECISION: "Decision",
};

export const STATUS_LABEL: Record<Status, string> = {
  UNSCHEDULED: "Unscheduled",
  NOW: "Now",
  NEXT: "Next",
  LATER: "Later",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
};

/** How Axiora opens, per mode. Intelligent colleague, not chatbot. */
export const MODE_OPENER: Record<Mode, string> = {
  SIMPLE: "Straightforward. Here's a reasonable way to approach it.",
  AMBIGUOUS: "Before I break this down, I need one clarification.",
  DEPENDENCY: "You can do this, but something may be in the way first.",
  DECISION: "This is a decision, and decisions need evidence before an answer.",
};

export type WorkItem = {
  id: string;
  raw_goal: string;
  title: string;
  description: string | null;
  workstream: string;
  status: Status;
  mode: Mode;
  steps: string[];
  next_action: string | null;
  blocked_by: string | null;
  blocker_label: string | null;
  blocker_confirmed: boolean | null;
  clarifying_question: string | null;
  clarifying_options: string[];
  clarifying_answer: string | null;
  ai_reasoning: string | null;
  user_corrections: { from: string; to: string; at: string }[];
  decision_id: string | null;
  created_at: string;
};

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

/** Normalises a raw database row into the shape the UI relies on. */
export function toWorkItem(row: Record<string, unknown>): WorkItem {
  return {
    id: String(row["id"]),
    raw_goal: String(row["raw_goal"] ?? ""),
    title: String(row["title"] ?? ""),
    description: (row["description"] as string | null) ?? null,
    workstream: String(row["workstream"] ?? "General"),
    status: (STATUSES as readonly string[]).includes(String(row["status"]))
      ? (row["status"] as Status)
      : "UNSCHEDULED",
    mode: (MODES as readonly string[]).includes(String(row["mode"]))
      ? (row["mode"] as Mode)
      : "SIMPLE",
    steps: asStringArray(row["steps"]),
    next_action: (row["next_action"] as string | null) ?? null,
    blocked_by: (row["blocked_by"] as string | null) ?? null,
    blocker_label: (row["blocker_label"] as string | null) ?? null,
    blocker_confirmed: (row["blocker_confirmed"] as boolean | null) ?? null,
    clarifying_question: (row["clarifying_question"] as string | null) ?? null,
    clarifying_options: asStringArray(row["clarifying_options"]),
    clarifying_answer: (row["clarifying_answer"] as string | null) ?? null,
    ai_reasoning: (row["ai_reasoning"] as string | null) ?? null,
    user_corrections: Array.isArray(row["user_corrections"])
      ? (row["user_corrections"] as WorkItem["user_corrections"])
      : [],
    decision_id: (row["decision_id"] as string | null) ?? null,
    created_at: String(row["created_at"] ?? ""),
  };
}

/** Visual prominence order used by the workspace: Now loudest, Completed quietest. */
const PROMINENCE: Record<Status, number> = {
  NOW: 0,
  BLOCKED: 1,
  NEXT: 2,
  UNSCHEDULED: 3,
  LATER: 4,
  COMPLETED: 5,
};

export function byProminence(a: WorkItem, b: WorkItem): number {
  const diff = PROMINENCE[a.status] - PROMINENCE[b.status];
  return diff !== 0 ? diff : b.created_at.localeCompare(a.created_at);
}

/** Workstreams emerge from the work itself; only ones with work appear. */
export function groupByWorkstream(items: WorkItem[]): [string, WorkItem[]][] {
  const map = new Map<string, WorkItem[]>();
  for (const item of items) {
    const key = item.workstream.trim() || "General";
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return [...map.entries()]
    .map(([name, group]) => [name, [...group].sort(byProminence)] as [string, WorkItem[]])
    .sort((a, b) => {
      const diff = PROMINENCE[a[1][0]!.status] - PROMINENCE[b[1][0]!.status];
      return diff !== 0 ? diff : a[0].localeCompare(b[0]);
    });
}
