import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/faq")({
  head: () => ({ meta: [{ title: "FAQ — Axiora Help Center" }] }),
  component: Page,
});

const qas: { q: string; a: React.ReactNode }[] = [
  { q: "Is Axiora's analysis powered by AI?", a: <>No — it's a deterministic, rule-based calculation. See the <Link to="/help/decision-framework">Decision Framework</Link>.</> },
  { q: "Can I invite teammates to a board?", a: <>Not yet — single owner per board.</> },
  { q: "What does the Organization visibility option do?", a: <>Nothing yet — not functional.</> },
  { q: "Can I choose a decision type other than Launch Readiness?", a: <>Not yet.</> },
  { q: "What do board templates change?", a: <>Nothing structural — see the <Link to="/help/user-guide">User Guide</Link>.</> },
  { q: "Why can't I delete a board?", a: <>Only boards that have never been analyzed and have no decision recorded can be deleted.</> },
  { q: "What happens after I edit evidence post-analysis?", a: <>The board is marked Outdated; the previous analysis stays in Decision History.</> },
  { q: "Can I compare two analyses?", a: <>Not currently.</> },
  { q: "Is there a minimum evidence requirement to analyze?", a: <>No.</> },
  { q: "How is a decision recorded?", a: <>By changing board Status — there's no separate reasoning field yet.</> },
  { q: "Can I export my data?", a: <>Not currently.</> },
  { q: "Is my data visible to anyone else?", a: <>No — Row Level Security scopes everything to your account.</> },
];

function Page() {
  return (
    <HelpShell title="FAQ" crumb="FAQ" showBackLink>
      <p className="lead">Common questions, answered directly.</p>
      <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-surface">
        {qas.map((item, i) => (
          <details key={i} className="group px-4 py-3">
            <summary className="cursor-pointer list-none font-medium text-foreground marker:hidden flex justify-between items-center gap-3">
              <span>{item.q}</span>
              <span className="text-muted-foreground text-lg leading-none group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <div className="mt-2 text-sm text-muted-foreground">{item.a}</div>
          </details>
        ))}
      </div>
    </HelpShell>
  );
}
