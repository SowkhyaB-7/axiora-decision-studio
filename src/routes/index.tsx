import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import {
  ArrowUpRight,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Home — Axiora" }],
  }),
  component: Home,
});

const stats = [
  { label: "Active boards", value: "12", delta: "+3 this week", icon: FileText },
  { label: "Decisions shipped", value: "48", delta: "+6 this month", icon: CheckCircle2 },
  { label: "Avg. time to decide", value: "6.2d", delta: "-1.4d vs. Q3", icon: Clock },
  { label: "Stakeholders engaged", value: "37", delta: "9 teams", icon: Users },
];

const boards = [
  {
    title: "Pricing tier restructure — Q4",
    owner: "Maya Ramirez",
    status: "In review",
    tone: "info",
    progress: 72,
    updated: "2h ago",
  },
  {
    title: "Mobile onboarding v3",
    owner: "Jordan Klein",
    status: "Evidence gathering",
    tone: "warning",
    progress: 41,
    updated: "Yesterday",
  },
  {
    title: "AI copilot rollout",
    owner: "Priya Natarajan",
    status: "Aligned",
    tone: "success",
    progress: 96,
    updated: "3d ago",
  },
  {
    title: "Enterprise SSO GA",
    owner: "Elliot Chen",
    status: "Blocked",
    tone: "destructive",
    progress: 28,
    updated: "1w ago",
  },
];

const toneClass: Record<string, string> = {
  info: "bg-info/10 text-info border-info/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
};

function Home() {
  return (
    <AppShell title="Home" subtitle="Overview of decision preparation across your org">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Monday, July 6
              </div>
              <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
                Good morning, Maya.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                Four boards need your attention this week. Axiora surfaced{" "}
                <span className="text-foreground">12 new pieces of evidence</span> across
                Customer, Technical, and Business dimensions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/decisions/new"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> New decision board
              </Link>
              <Link
                to="/decisions/overview"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-surface-muted"
              >
                View overview <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 font-display text-3xl">{s.value}</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-success" /> {s.delta}
              </div>
            </div>
          ))}
        </section>

        {/* Boards */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold">Active decision boards</h2>
                <p className="text-xs text-muted-foreground">
                  Prioritized by upcoming review dates
                </p>
              </div>
              <Link
                to="/decisions/overview"
                className="text-xs font-medium text-accent hover:underline"
              >
                See all
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {boards.map((b) => (
                <li key={b.title}>
                  <Link
                    to="/decisions/overview"
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 hover:bg-surface-muted"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{b.title}</span>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${toneClass[b.tone]}`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Owner · {b.owner} · Updated {b.updated}
                      </div>
                      <div className="mt-2 h-1 w-full max-w-xs overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${b.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold">{b.progress}%</div>
                      <div className="text-[10px] text-muted-foreground">ready</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold">Needs attention</h3>
              <ul className="mt-3 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                  <div>
                    <div className="font-medium">Missing customer evidence</div>
                    <div className="text-xs text-muted-foreground">
                      Mobile onboarding v3 · 2 interviews pending
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                  <div>
                    <div className="font-medium">Blocked stakeholder alignment</div>
                    <div className="text-xs text-muted-foreground">
                      Enterprise SSO GA · Security review needed
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                  <div>
                    <div className="font-medium">Ready to decide</div>
                    <div className="text-xs text-muted-foreground">
                      AI copilot rollout · All 5 dimensions green
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-primary p-5 text-primary-foreground">
              <div className="text-xs uppercase tracking-widest opacity-70">
                Weekly digest
              </div>
              <div className="mt-2 font-display text-2xl leading-snug">
                Your team decided 3× faster than last quarter.
              </div>
              <button className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium hover:bg-primary-foreground/20">
                Read the summary <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
