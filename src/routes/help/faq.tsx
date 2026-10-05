import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/faq")({
  head: () => helpMeta("FAQ", "Answers to common questions about using Axiora."),
  component: Page,
});

const qas: { q: string; a: React.ReactNode }[] = [
  { q: "Do I need to choose a type of work?", a: <>No. Axiora works that out from what you write. See <Link to="/help/understanding-work">How Axiora Understands Work</Link>.</> },
  { q: "Why does my card say No deadline?", a: <>You didn't mention a clear date or time, so Axiora didn't guess one. Open the card to add one.</> },
  { q: "Axiora put my work in the wrong workstream. Can I fix it?", a: <>Yes. Edit the request from the card and Axiora will read it again.</> },
  { q: "Why did Axiora ask me a question?", a: <>Your answer would change what it suggests. It asks at most one question.</> },
  { q: "Where are my completed items?", a: <>Switch to Completed above your workspace. You can reopen anything from there.</> },
  { q: "Does Axiora read the files I attach to work?", a: <>It stores them and shows their text if you ask, but it doesn't analyze them. Files added as evidence in a Decision Briefing are read and summarized for you to review.</> },
  { q: "Does the Decision Briefing give a score?", a: <>No. It describes where the evidence points in plain language, and calls out conflicts.</> },
  { q: "Can I share my workspace with teammates?", a: <>Not yet.</> },
  { q: "Can someone else see my work?", a: <>Your work is tied to your account and isn't shown to other users.</> },
  { q: "Can I export my data?", a: <>Not yet.</> },
];

function Page() {
  return (
    <HelpShell title="FAQ" crumb="FAQ" showBackLink>
      <p className="lead">Answers to common questions about using Axiora.</p>
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
