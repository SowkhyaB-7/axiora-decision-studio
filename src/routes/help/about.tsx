import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/about")({
  head: () => ({ meta: [{ title: "About Axiora — Help Center" }] }),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="About Axiora" crumb="About Axiora" showBackLink>
      <h2>Why Axiora exists</h2>
      <p>
        Product Managers spend a disproportionate amount of time preparing decisions,
        not making them. Most tools manage the work around a decision; very few are
        built around the decision itself.
      </p>

      <h2>The product problem it solves</h2>
      <p>
        Before a launch decision, evidence is usually scattered with no consistent way
        to tell whether a decision is actually ready or just feels ready. Axiora gives
        that evidence one place to live and produces a consistent readiness signal from
        it.
      </p>

      <h2>Who it's designed for</h2>
      <ul>
        <li>Product Managers preparing a launch decision</li>
        <li>Associate Product Managers supporting that preparation</li>
      </ul>

      <h2>The philosophy behind evidence-driven decisions</h2>
      <p>
        Axiora prepares decisions. It does not make them. That same principle extends to
        how Axiora is documented: this Help Center describes what's actually
        implemented, not what's planned or aspirational.
      </p>

      <h2>Current implementation scope</h2>
      <p>
        Version 1.0 supports one workflow — Launch Readiness — across five fixed
        dimensions, with deterministic scoring, for a single user preparing their own
        decisions. No team collaboration, integrations, or export yet.
      </p>
    </HelpShell>
  );
}
