import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Cog,
  Briefcase,
  Workflow,
  Handshake,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/boards/$id/analysis")({
  head: () => ({
    meta: [{ title: "Analysis Results — Axiora" }],
  }),
  component: Analysis,
});

const dims: { name: string; icon: LucideIcon; score: number }[] = [
  { name: "Customer Validation", icon: Users, score: 82 },
  { name: "Product & Technical Readiness", icon: Cog, score: 64 },
  { name: "Business Readiness", icon: Briefcase, score: 71 },
  { name: "Operational Readiness", icon: Workflow, score: 48 },
  { name: "Stakeholder Alignment", icon: Handshake, score: 88 },
];

const overall = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);

function scoreColor(s: number) {
  if (s >= 75) return "text-success";
  if (s >= 55) return "text-info";
  return "text-warning";
}

function Analysis() {
  const { id } = Route.useParams();
  return (
    <AppShell title="Analysis Results" subtitle="Axiora's readiness synthesis across five dimensions">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          to="/boards/$id"
          params={{ id }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to board
        </Link>

        <section className="rounded-2xl border border-border bg-primary p-6 text-primary-foreground md:p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-70">
            <Sparkles className="h-3.5 w-3.5" /> Overall readiness
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-6">
            <div className="font-display text-6xl leading-none">{overall}</div>
            <div className="max-w-xl text-sm opacity-90">
              You're on track for a Q1 launch. Operational readiness is the primary blocker —
              staffing on-call rotation and completing runbooks unblocks the decision.
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dims.map((d) => (
            <article key={d.name} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-muted">
                    <d.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div className="text-sm font-semibold">{d.name}</div>
                </div>
                <div className={`font-display text-2xl ${scoreColor(d.score)}`}>{d.score}</div>
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-accent" style={{ width: `${d.score}%` }} />
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-success" /> Strengths
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <TrendingUp className="mt-0.5 h-4 w-4 text-success" />
                Strong customer pull in mid-market with 14 validating interviews.
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="mt-0.5 h-4 w-4 text-success" />
                Stakeholder alignment nearly complete — 6 of 7 sign-offs secured.
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="mt-0.5 h-4 w-4 text-success" />
                Business case validated; pricing v3 in final finance review.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-warning" /> Risks & gaps
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                Operational readiness at 48 — on-call rotation not staffed.
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                3 support runbooks outstanding; SLA not yet defined.
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                P95 latency 820ms exceeds 500ms target for enterprise tier.
              </li>
            </ul>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold">Recommended next actions</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <span className="text-foreground">1.</span> Staff copilot on-call rotation with 2
              engineers from Platform team.
            </li>
            <li>
              <span className="text-foreground">2.</span> Complete remaining 3 support runbooks
              before Jan 15.
            </li>
            <li>
              <span className="text-foreground">3.</span> Confirm finance sign-off on pricing v3 and
              lock GTM narrative.
            </li>
            <li>
              <span className="text-foreground">4.</span> Schedule final security review for
              enterprise SSO integration.
            </li>
          </ol>
        </section>
      </div>
    </AppShell>
  );
}
