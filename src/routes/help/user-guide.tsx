import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/user-guide")({
  head: () => ({ meta: [{ title: "User Guide — Axiora Help Center" }] }),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="User Guide" crumb="User Guide" showBackLink>
      <p className="lead">
        Every feature currently implemented in Axiora. If something isn't listed here,
        it isn't built yet — check <Link to="/help/limitations">Known Limitations</Link>{" "}
        for the deliberate gaps.
      </p>

      <h2>Account &amp; Authentication</h2>
      <p>
        <strong>What:</strong> Email/password accounts with sign up, sign in, sign out,
        and password reset.<br />
        <strong>Why:</strong> every board and its evidence needs to be private to the
        person preparing it.<br />
        <strong>Limitations:</strong> no social login, no MFA, no team invitations.
      </p>

      <h2>Decision Boards</h2>
      <p>
        <strong>What:</strong> frames one decision.<br />
        <strong>Why:</strong> keeps evidence for different decisions from blurring
        together.<br />
        <strong>Limitations:</strong> one owner per board; can only be deleted if never
        analyzed and no decision recorded.
      </p>

      <h2>Board Templates</h2>
      <p>
        Today, the template you choose has no effect. Every board — regardless of
        template — gets the same five fixed dimensions. Treat it as a label for your
        own organization, not a functional setting.
      </p>

      <h2>Decision Type</h2>
      <p>
        Launch Readiness is the only option that can be selected; five others are shown
        as “Coming Soon.” Selecting a different type doesn't change anything yet.
      </p>

      <h2>Visibility</h2>
      <p>
        Not functional. Every board is private to the account that created it regardless
        of which option is selected — don't rely on this for access control.
      </p>

      <h2>The Five Readiness Dimensions</h2>
      <p>
        All five are auto-created on every board and run on one shared evidence engine —
        fixed, can't be added, removed, renamed, or reordered. See the{" "}
        <Link to="/help/decision-framework">Decision Framework</Link> for the scoring
        formula behind them.
      </p>

      <h2>Evidence</h2>
      <p>
        Fields: Title (required), Evidence Type, Description, Evidence Strength,
        Evidence Date (required, cannot be in the future), Source/Link, Notes,
        Attachments (multiple files supported). No commenting or review workflow;
        editing overwrites the previous value with no history.
      </p>

      <h2>File Attachments</h2>
      <p>
        Multiple files can be selected at once and replaced later. No in-app file
        preview; no file size or type guardrails surfaced ahead of upload.
      </p>

      <h2>Analyze Decision</h2>
      <p>
        Produces a readiness score, confidence score, and recommendation per dimension.
        This is rule-based, not AI-generated — the same evidence always produces the
        same result. No minimum evidence requirement; no manual override of a score.
      </p>

      <h2>Outdated Analysis</h2>
      <p>
        Adding, editing, or deleting evidence after an analysis marks the board
        Outdated. The previous analysis isn't changed — it stays in Decision History.
        The flag is board-wide, not per-dimension.
      </p>

      <h2>Decision History</h2>
      <p>
        Each analysis run adds a new version (v1, v2, v3…); past versions are read-only.
        No side-by-side comparison between two versions yet.
      </p>

      <h2>Recording a Decision</h2>
      <p>
        This is a status change only — there's no separate field for what you decided or
        your written reasoning. If you want that preserved, write it into the board's
        description or evidence notes first.
      </p>
    </HelpShell>
  );
}
