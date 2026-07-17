import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/core-concepts")({
  head: () => ({ meta: [{ title: "Core Concepts — Axiora Help Center" }] }),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Core Concepts" crumb="Core Concepts" showBackLink>
      <p className="lead">
        The terms Axiora uses, defined once so the rest of the Help Center can assume
        them.
      </p>

      <h2>Decision Board</h2>
      <p>
        A single decision you're preparing. Every board has one owner and the same five
        readiness dimensions.
      </p>

      <h2>Assessment Dimension</h2>
      <p>
        One of five fixed categories of readiness. Every board has all five; none can be
        added, removed, or customized.
      </p>

      <h2>Evidence</h2>
      <p>
        A single logged observation supporting (or undercutting) a dimension. Each item
        has a type, strength, and date, which is what allows it to be scored consistently.
      </p>

      <h2>Readiness</h2>
      <p>
        A 0–100 score per dimension (and an overall average) describing how well-supported
        a dimension is by evidence. Computed by a fixed formula — see the{" "}
        <Link to="/help/decision-framework">Decision Framework</Link>.
      </p>

      <h2>Confidence</h2>
      <p>
        A separate score describing how much to trust the readiness score itself —
        weighted more heavily toward evidence strength than readiness is.
      </p>

      <h2>Analysis</h2>
      <p>
        The result of running <strong>Analyze Decision</strong> on a board — a full
        snapshot of every dimension's readiness, confidence, strengths, risks, and
        recommended actions at that moment. Not AI-generated.
      </p>

      <h2>Decision History</h2>
      <p>
        Every analysis you've ever run on a board, kept in order. Running a new analysis
        adds a new version; it never overwrites a previous one.
      </p>

      <h2>Board Status</h2>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Draft</td><td>Just created, still being framed</td></tr>
          <tr><td>In Progress</td><td>Evidence is actively being gathered</td></tr>
          <tr><td>In Review</td><td>Being reviewed ahead of a decision</td></tr>
          <tr><td>Decision Recorded</td><td>A final call has been made — the board can no longer be deleted</td></tr>
          <tr><td>Archived</td><td>No longer active</td></tr>
        </tbody>
      </table>
    </HelpShell>
  );
}
