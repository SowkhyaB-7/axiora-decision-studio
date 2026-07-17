import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/getting-started")({
  head: () => ({ meta: [{ title: "Getting Started — Axiora Help Center" }] }),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Getting Started" crumb="Getting Started" showBackLink>
      <p className="lead">
        Axiora helps you prepare a launch decision by organizing evidence around five
        questions that determine whether it's actually ready — then keeping a record of
        what you decided and why.
      </p>

      <h2>What Axiora is</h2>
      <p>
        A decision preparation tool for Product Managers. It doesn't manage projects,
        track tickets, or replace your roadmap — it focuses on one thing: preparing a
        specific decision before you commit to it.
      </p>

      <h2>Who it's for</h2>
      <ul>
        <li>Product Managers preparing a launch decision</li>
        <li>Associate Product Managers supporting that preparation</li>
      </ul>

      <h2>The first-time workflow</h2>
      <ol>
        <li>Sign up with your email and password</li>
        <li>Create a Decision Board for the launch decision you're preparing</li>
        <li>Add evidence to each of the five readiness dimensions</li>
        <li>
          Run an analysis to see a readiness score and recommendation for each dimension
        </li>
        <li>Record your decision once you're ready to move forward</li>
      </ol>

      <h2>Creating your first Decision Board</h2>
      <p>
        From Home, select <strong>New Decision Board</strong>. You'll be asked for a
        Decision Title and Context (both required), a Decision Type (only Launch
        Readiness is functional today), a Target Date, a Template (a label only), and
        Visibility (shown for context, not functional yet).
      </p>
      <p>
        Every board automatically gets all five readiness dimensions — Customer
        Validation, Product &amp; Technical Readiness, Business Readiness, Operational
        Readiness, and Stakeholder Alignment. You can't remove, add, or reorder them.
        See <Link to="/help/decision-framework">the Decision Framework</Link> for why.
      </p>
    </HelpShell>
  );
}
