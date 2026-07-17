import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/limitations")({
  head: () => ({ meta: [{ title: "Known Limitations — Axiora Help Center" }] }),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Known Limitations" crumb="Known Limitations" showBackLink>
      <p className="lead">
        Intentional scope boundaries for Version 1.0 — deliberate choices about what to
        leave out of a first release, not bugs. See the{" "}
        <Link to="/help/user-guide">User Guide</Link> for how the features that do
        exist behave.
      </p>

      <h2>Scoring</h2>
      <ul>
        <li>Analysis is rule-based, not AI-generated</li>
        <li>No minimum evidence requirement before an analysis can be run</li>
        <li>No per-dimension weighting</li>
      </ul>

      <h2>Collaboration</h2>
      <ul>
        <li>One owner per board, no sharing, no comments</li>
        <li>Team / Organization visibility setting is not functional yet</li>
      </ul>

      <h2>Scope of decisions supported</h2>
      <ul>
        <li>Only Launch Readiness is functional; five others are visible but disabled</li>
        <li>Board templates are a label only</li>
        <li>No custom or additional readiness dimensions</li>
      </ul>

      <h2>Account &amp; access</h2>
      <ul>
        <li>No multi-factor authentication, no social login, no team invitations</li>
      </ul>

      <h2>Data</h2>
      <ul>
        <li>No data export, no integrations</li>
        <li>Recording a decision only changes status — no separate reasoning field yet</li>
      </ul>
    </HelpShell>
  );
}
