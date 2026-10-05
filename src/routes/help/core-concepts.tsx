import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/core-concepts")({
  head: () =>
    helpMeta(
      "Core Concepts",
      "The main ideas behind Axiora, including work, next steps, evidence, decisions, and uncertainty.",
    ),
  component: Page,
});

const concepts = [
  ["Work", "Anything you're trying to accomplish. It can be small and clear, or vague and still taking shape."],
  ["Next step", "The one thing you could reasonably do next. Axiora suggests it, but you decide."],
  ["Workstream", "A loose grouping like Product or Marketing. Axiora picks it for you so you can see related work together."],
  ["What you told me", "Your own words, plus any answer or deadline you gave. Axiora treats this as fact."],
  ["What I'm inferring", "Axiora's reading of the situation. It's shown separately so you can tell it apart from what you said."],
  ["Suggested approach", "A proposed way to get the work done. It's a starting point, not a requirement."],
  ["Decision", "A choice you need to make, like whether to launch something now. Decisions get a Decision Briefing."],
  ["Evidence", "Notes, findings, or documents that argue for or against going ahead with a decision."],
  ["Uncertainty", "When information is missing or conflicting, Axiora says so instead of guessing."],
];

function Page() {
  return (
    <HelpShell title="Core Concepts" crumb="Core Concepts" showBackLink>
      <p className="lead">A short glossary of the ideas you'll see around Axiora.</p>
      <dl className="mt-6 space-y-5">
        {concepts.map(([term, def]) => (
          <div key={term}>
            <dt className="font-medium text-foreground">{term}</dt>
            <dd className="mt-1 text-muted-foreground">{def}</dd>
          </div>
        ))}
      </dl>
    </HelpShell>
  );
}
