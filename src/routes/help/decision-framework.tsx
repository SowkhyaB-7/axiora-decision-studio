import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { HelpMermaid } from "@/components/help-mermaid";

export const Route = createFileRoute("/help/decision-framework")({
  head: () => ({ meta: [{ title: "Decision Framework — Axiora Help Center" }] }),
  component: Page,
});

const fiveDimensions = `flowchart LR
  D[Launch Decision] --> C[Customer Validation]
  D --> P[Product & Technical]
  D --> B[Business Readiness]
  D --> O[Operational Readiness]
  D --> S[Stakeholder Alignment]`;

const scoringFlow = `flowchart TD
  E[Evidence items] --> TC[Type Coverage · 40%]
  E --> ST[Evidence Strength · 25%]
  E --> V[Volume · 20%]
  E --> R[Recency · 15%]
  TC --> RS[Readiness Score 0–100]
  ST --> RS
  V --> RS
  R --> RS
  ST --> CF[Confidence Score 0–100]
  TC --> CF
  R --> CF`;

function Page() {
  return (
    <HelpShell title="Decision Framework" crumb="Decision Framework" showBackLink>
      <h2>Why evidence-driven decisions matter</h2>
      <p>
        Launch decisions are usually made with partial information spread across
        interviews, tickets, spreadsheets, and conversations. Axiora exists to gather
        evidence deliberately, evaluate it consistently, and make gaps visible before
        they become surprises.
      </p>

      <h2>The philosophy behind Axiora</h2>
      <p>
        Axiora prepares decisions. It does not make them. Every score, risk, and
        recommendation is meant to inform judgment, not replace it.
      </p>

      <h2>Why five assessment dimensions</h2>
      <p>
        A launch decision reliably depends on five things converging: customer demand,
        buildability, business value, organizational support, and stakeholder sign-off.
        Fixed dimensions keep a readiness score comparable across every decision.
      </p>

      <HelpMermaid chart={fiveDimensions} caption="The five dimensions of a launch decision." />

      <h2>How Readiness Analysis works</h2>
      <table>
        <thead>
          <tr>
            <th>Factor</th>
            <th>Weight</th>
            <th>What it measures</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Type Coverage</td>
            <td>40%</td>
            <td>Of the evidence types considered central to this dimension, how many do you have at least one item for?</td>
          </tr>
          <tr>
            <td>Evidence Strength</td>
            <td>25%</td>
            <td>Average strength of your evidence (Strong = 1.0, Medium = 0.6, Weak = 0.3)</td>
          </tr>
          <tr>
            <td>Volume</td>
            <td>20%</td>
            <td>Number of evidence items logged, capped at 5</td>
          </tr>
          <tr>
            <td>Recency</td>
            <td>15%</td>
            <td>Share of evidence dated within the last 180 days</td>
          </tr>
        </tbody>
      </table>

      <h3>Readiness score</h3>
      <p>
        <code>100 × (0.40 × Type Coverage + 0.25 × Evidence Strength + 0.20 × Volume + 0.15 × Recency)</code>
        {" "}— 75+ High, 50–74 Medium, below 50 Low.
      </p>

      <h3>How confidence differs from readiness</h3>
      <p>
        <code>Confidence = 100 × (0.50 × Evidence Strength + 0.30 × Type Coverage + 0.20 × Recency)</code>.
        A dimension can show a decent readiness score built on thin, low-confidence
        evidence — confidence tells you to treat that score cautiously.
      </p>

      <HelpMermaid chart={scoringFlow} caption="How evidence flows into the readiness and confidence scores." />

      <h3>Overall recommendation</h3>
      <ul>
        <li><strong>75+</strong> — Ready, proceed.</li>
        <li><strong>55–74</strong> — Ready with Conditions, proceed with caution.</li>
        <li><strong>Below 55</strong> — Not Ready, hold and gather more evidence.</li>
      </ul>

      <h2>Why Version 1.0 intentionally avoids AI-generated scoring</h2>
      <p>
        Readiness Analysis is a deterministic formula, not an AI model — deliberately.
        It's explainable (every score traces back to specific evidence), reproducible
        (same evidence, same score, always), and has no external dependency, API key, or
        provider outage risk.
      </p>
      <blockquote>
        This does mean the formula can't apply judgment the way a person might — it can't
        tell a deep, highly relevant interview from a shallow, tangential one. An
        AI-based layer is a plausible future addition on top of this model, not a
        replacement for it.
      </blockquote>

      <h2>The five dimensions in practice</h2>
      <table>
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Core question</th>
            <th>Example evidence</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Customer Validation</td>
            <td>Should we build this?</td>
            <td>Interviews, usage analytics, surveys</td>
          </tr>
          <tr>
            <td>Product &amp; Technical Readiness</td>
            <td>Can we build this successfully?</td>
            <td>Technical spikes, feasibility notes</td>
          </tr>
          <tr>
            <td>Business Readiness</td>
            <td>Will this create business value?</td>
            <td>Market research, sales calls</td>
          </tr>
          <tr>
            <td>Operational Readiness</td>
            <td>Can the org support this after launch?</td>
            <td>Support ticket trends</td>
          </tr>
          <tr>
            <td>Stakeholder Alignment</td>
            <td>Have the right stakeholders signed off?</td>
            <td>Logged approvals and sign-off notes</td>
          </tr>
        </tbody>
      </table>

      <p>
        See the <Link to="/help/user-guide">User Guide</Link> for how to add evidence and
        run an analysis, or <Link to="/help/limitations">Known Limitations</Link> for
        what the formula intentionally doesn't do.
      </p>
    </HelpShell>
  );
}
