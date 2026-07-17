import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/release-notes")({
  head: () => ({ meta: [{ title: "Release Notes — Axiora Help Center" }] }),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Release Notes — v1.0.0" crumb="Release Notes" showBackLink>
      <p className="lead">
        Version 1.0.0 is Axiora's first tagged release: a single-user tool for preparing
        a Launch Readiness decision across five fixed dimensions, with evidence
        logging, rule-based readiness scoring, and versioned analysis history.
      </p>

      <h2>Authentication</h2>
      <ul>
        <li>Email/password sign up and sign in, sign out, forgot/reset password</li>
      </ul>

      <h2>Decision Boards</h2>
      <ul>
        <li>Create, edit, archive, delete; status tracking; Decision Type and Template fields</li>
      </ul>

      <h2>Five Readiness Dimensions</h2>
      <ul>
        <li>Automatically created on every new board, powered by a single shared evidence engine</li>
      </ul>

      <h2>Evidence</h2>
      <ul>
        <li>
          Create, edit, delete; type, strength, date, source link, notes; multiple
          attachments with replacement
        </li>
      </ul>

      <h2>Analysis</h2>
      <ul>
        <li>
          Deterministic scoring; strengths, risks, missing evidence, recommended actions;
          overall recommendation; automatic Outdated flagging; versioned Decision History
        </li>
      </ul>
    </HelpShell>
  );
}
