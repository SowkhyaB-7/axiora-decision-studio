import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/product-principles")({
  head: () =>
    helpMeta("Product Principles", "The thinking behind the way Axiora is designed."),
  component: Page,
});

const principles = [
  ["Start with what the person is trying to accomplish", "The goal comes first. Everything else follows from it."],
  ["Don't make people organize their work before getting help", "No projects, fields, or categories to fill in up front."],
  ["Ask for clarification only when it matters", "One question at most, and only when the answer changes the advice."],
  ["Keep assumptions visible", "What Axiora infers is shown separately from what you said."],
  ["Don't invent certainty", "No made up deadlines, stakeholders, or approvals. Missing or conflicting information is named."],
  ["Save deeper analysis for when it's needed", "Decisions get a full briefing. Everyday tasks don't."],
  ["Keep the user in control", "Every suggestion can be edited, corrected, or ignored."],
  ["Reduce cognitive load", "Axiora should leave you with less to manage, not more process."],
];

function Page() {
  return (
    <HelpShell title="Product Principles" crumb="Product Principles" showBackLink>
      <p className="lead">The ideas that shape how Axiora behaves.</p>
      <ol className="mt-6 space-y-4">
        {principles.map(([t, d]) => (
          <li key={t}>
            <strong>{t}.</strong> {d}
          </li>
        ))}
      </ol>
    </HelpShell>
  );
}
