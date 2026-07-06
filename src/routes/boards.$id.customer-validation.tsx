import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ArrowLeft, Users, MessageSquare, FileText, TrendingUp, Plus } from "lucide-react";

export const Route = createFileRoute("/boards/$id/customer-validation")({
  head: () => ({
    meta: [{ title: "Customer Validation — Axiora" }],
  }),
  component: CustomerValidation,
});

const signals = [
  { label: "Interviews logged", value: "14", delta: "+3 this week" },
  { label: "NPS delta (beta)", value: "+21", delta: "vs. baseline" },
  { label: "Requests / week", value: "38", delta: "+12 WoW" },
  { label: "Segments covered", value: "4 / 5", delta: "Mid-market strongest" },
];

const interviews = [
  { name: "Northwind Ops", persona: "Head of Ops", sentiment: "Positive", when: "2d ago" },
  { name: "Contoso Retail", persona: "Product Lead", sentiment: "Positive", when: "4d ago" },
  { name: "Fabrikam Health", persona: "CTO", sentiment: "Mixed", when: "1w ago" },
  { name: "Adventure Works", persona: "PM", sentiment: "Positive", when: "1w ago" },
];

function CustomerValidation() {
  const { id } = Route.useParams();
  return (
    <AppShell title="Customer Validation" subtitle="Evidence from interviews, feedback, and usage">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          to="/boards/$id"
          params={{ id }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to board
        </Link>

        <section className="rounded-2xl border border-border bg-surface p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-surface-muted">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-3xl md:text-4xl">Customer Validation</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Strong pull from mid-market ops teams. Enterprise buyers still evaluating integration
                depth. Continue interviews with security stakeholders.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {signals.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-surface-muted p-4">
                <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
                <div className="mt-2 font-display text-2xl">{s.value}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-success" /> {s.delta}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold">Customer interviews</h2>
                <p className="text-xs text-muted-foreground">Recent conversations logged to this board</p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
                <Plus className="h-3.5 w-3.5" /> Log interview
              </button>
            </div>
            <ul className="divide-y divide-border">
              {interviews.map((i) => (
                <li key={i.name} className="flex items-center gap-4 px-6 py-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-muted">
                    <MessageSquare className="h-4 w-4 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.persona} · {i.when}
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      i.sentiment === "Positive"
                        ? "border-success/20 bg-success/10 text-success"
                        : "border-warning/20 bg-warning/10 text-warning"
                    }`}
                  >
                    {i.sentiment}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> Attached research
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="rounded-md border border-border p-3">
                <div className="font-medium">Q4 discovery synthesis</div>
                <div className="mt-0.5 text-xs text-muted-foreground">PDF · 12 pages</div>
              </li>
              <li className="rounded-md border border-border p-3">
                <div className="font-medium">Usability test — v3 flow</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Video · 24 min</div>
              </li>
              <li className="rounded-md border border-border p-3">
                <div className="font-medium">In-product feedback export</div>
                <div className="mt-0.5 text-xs text-muted-foreground">CSV · 148 rows</div>
              </li>
            </ul>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
