import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import {
  Users,
  Cog,
  Briefcase,
  Workflow,
  Handshake,
  ArrowUpRight,
  Share2,
  MoreHorizontal,
  Sparkles,
  FileText,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/decisions/overview")({
  head: () => ({
    meta: [{ title: "Decision Board Overview — Axiora" }],
  }),
  component: BoardOverview,
});

type Status = "ready" | "in-progress" | "attention";

const statusMeta: Record<Status, { label: string; classes: string; icon: LucideIcon }> = {
  ready: {
    label: "Ready",
    classes: "bg-success/10 text-success border-success/20",
    icon: CheckCircle2,
  },
  "in-progress": {
    label: "In progress",
    classes: "bg-info/10 text-info border-info/20",
    icon: Clock,
  },
  attention: {
    label: "Needs attention",
    classes: "bg-warning/10 text-warning border-warning/20",
    icon: AlertTriangle,
  },
};

type Dimension = {
  name: string;
  icon: LucideIcon;
  score: number;
  status: Status;
  summary: string;
  signals: { label: string; value: string }[];
};

const dimensions: Dimension[] = [
  {
    name: "Customer Validation",
    icon: Users,
    score: 82,
    status: "ready",
    summary:
      "14 interviews and 2 usability studies show strong pull from mid-market segment.",
    signals: [
      { label: "Interviews logged", value: "14" },
      { label: "NPS delta (beta)", value: "+21" },
      { label: "Requests / week", value: "38" },
    ],
  },
  {
    name: "Product & Technical Readiness",
    icon: Cog,
    score: 64,
    status: "in-progress",
    summary:
      "Core flows implemented. Latency budget still being tuned in the inference layer.",
    signals: [
      { label: "Epics complete", value: "9 / 12" },
      { label: "P95 latency", value: "820ms" },
      { label: "Open risks", value: "3" },
    ],
  },
  {
    name: "Business Readiness",
    icon: Briefcase,
    score: 71,
    status: "in-progress",
    summary:
      "Pricing model drafted, awaiting finance sign-off. GTM narrative in review.",
    signals: [
      { label: "Forecast ARR", value: "$1.4M" },
      { label: "Payback", value: "8mo" },
      { label: "Pricing model", value: "Draft v3" },
    ],
  },
  {
    name: "Operational Readiness",
    icon: Workflow,
    score: 48,
    status: "attention",
    summary:
      "Support runbooks incomplete; on-call rotation for the new service not staffed.",
    signals: [
      { label: "Runbooks", value: "2 / 5" },
      { label: "SLA defined", value: "No" },
      { label: "Training", value: "Pending" },
    ],
  },
  {
    name: "Stakeholder Alignment",
    icon: Handshake,
    score: 88,
    status: "ready",
    summary: "Design, Eng, Legal, and Marketing aligned. Security review scheduled.",
    signals: [
      { label: "Sign-offs", value: "6 / 7" },
      { label: "Open threads", value: "2" },
      { label: "Next review", value: "Thu" },
    ],
  },
];

const overallScore = Math.round(
  dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length,
);

const activity = [
  {
    who: "Priya Natarajan",
    what: "attached the Q3 pricing sensitivity analysis to Business Readiness.",
    when: "12m ago",
    icon: FileText,
  },
  {
    who: "Elliot Chen",
    what: "commented on the SSO rollout risk in Stakeholder Alignment.",
    when: "1h ago",
    icon: MessageSquare,
  },
  {
    who: "Axiora",
    what: "flagged missing on-call rotation under Operational Readiness.",
    when: "3h ago",
    icon: Sparkles,
  },
  {
    who: "Jordan Klein",
    what: "marked Customer Validation as ready for review.",
    when: "Yesterday",
    icon: CheckCircle2,
  },
];

function scoreColor(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 55) return "text-info";
  return "text-warning";
}

function BoardOverview() {
  return (
    <AppShell
      title="AI copilot rollout"
      subtitle="Decision board · created Jun 24 · owner Maya Ramirez"
    >
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header card */}
        <section className="rounded-2xl border border-border bg-surface p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-medium text-accent">
                  Board #A-238
                </span>
                <span className="text-muted-foreground">Product · Q1 launch track</span>
              </div>
              <h1 className="mt-3 font-display text-3xl md:text-4xl">
                Should we launch the AI copilot to enterprise customers in Q1?
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                A cross-functional decision spanning Product, GTM, and Operations.
                Axiora is preparing evidence across five assessment dimensions to help
                the team decide by <span className="text-foreground">Jan 24, 2027</span>.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["Design", "Engineering", "GTM", "Legal", "Support"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted">
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <button className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface hover:bg-surface-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                  Advance to review <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-muted px-4 py-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Readiness
                  </div>
                  <div className={`font-display text-3xl ${scoreColor(overallScore)}`}>
                    {overallScore}
                  </div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Decide by
                  </div>
                  <div className="text-sm font-medium">Jan 24, 2027</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dimensions */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="font-display text-2xl">Assessment dimensions</h2>
              <p className="text-sm text-muted-foreground">
                Evidence is organized across five readiness dimensions.
              </p>
            </div>
            <Link
              to="/decisions/new"
              className="text-xs font-medium text-accent hover:underline"
            >
              Configure
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dimensions.map((d) => {
              const meta = statusMeta[d.status];
              const StatusIcon = meta.icon;
              return (
                <article
                  key={d.name}
                  className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted">
                        <d.icon className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">{d.name}</h3>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.classes}`}
                        >
                          <StatusIcon className="h-3 w-3" /> {meta.label}
                        </span>
                      </div>
                    </div>
                    <div className={`font-display text-2xl ${scoreColor(d.score)}`}>
                      {d.score}
                    </div>
                  </div>

                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${d.score}%` }}
                    />
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">{d.summary}</p>

                  <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
                    {d.signals.map((s) => (
                      <div key={s.label} className="min-w-0">
                        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {s.label}
                        </dt>
                        <dd className="mt-0.5 truncate text-sm font-medium">{s.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <button className="mt-5 inline-flex items-center gap-1 self-start text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    Open dimension <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* Activity + Summary */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">Activity</h2>
              <p className="text-xs text-muted-foreground">
                Latest updates from your team and Axiora
              </p>
            </div>
            <ul className="divide-y divide-border">
              {activity.map((a, i) => (
                <li key={i} className="flex items-start gap-4 px-6 py-4">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-muted">
                    <a.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{a.who}</span>{" "}
                      <span className="text-muted-foreground">{a.what}</span>
                    </p>
                    <div className="mt-0.5 text-xs text-muted-foreground">{a.when}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-xl border border-border bg-primary p-6 text-primary-foreground">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-70">
              <Sparkles className="h-3.5 w-3.5" /> Axiora summary
            </div>
            <h3 className="mt-3 font-display text-2xl leading-snug">
              You're 73% ready. Focus on Operational Readiness this week.
            </h3>
            <ul className="mt-4 space-y-2 text-sm opacity-90">
              <li>· Staff on-call rotation for copilot service</li>
              <li>· Complete 3 remaining support runbooks</li>
              <li>· Confirm finance sign-off on pricing v3</li>
            </ul>
            <button className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium hover:bg-primary-foreground/20">
              Draft action plan <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
