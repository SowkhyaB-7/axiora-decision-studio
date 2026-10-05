import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/decisions-evidence")({
  head: () =>
    helpMeta(
      "Decisions and Evidence",
      "How Axiora handles decisions, evidence, uncertainty, and conflicting information.",
    ),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Decisions and Evidence" crumb="Decisions and Evidence" showBackLink>
      <p className="lead">
        Most work doesn't need deep analysis. When something is a real decision, Axiora
        gives it more room.
      </p>

      <h2>The Decision Briefing</h2>
      <p>
        When you ask something like "Should we launch this now?", Axiora creates a
        Decision Briefing. It's a place to collect what you know and see where it points.
        It starts by saying there isn't enough evidence yet, because there isn't.
      </p>

      <h2>Adding evidence</h2>
      <p>
        Paste notes or upload a PDF, Word, or text file. Axiora pulls out the main
        points and suggests whether each one argues for or against going ahead. You
        review and confirm before anything is saved. Uploaded evidence keeps a link to
        the original file.
      </p>

      <h2>Known, inferred, suggested</h2>
      <p>
        Axiora keeps three things apart: what you told it, what it's inferring, and what
        it's suggesting. In a briefing, claims link back to the evidence they came from,
        so you can check them.
      </p>

      <h2>When evidence disagrees</h2>
      <p>
        If strong evidence points both ways, Axiora calls it a conflict and shows you
        where the tension is. It doesn't average things out into a score. If there's too
        little to go on, it says so.
      </p>

      <h2>Your call</h2>
      <p>
        You can disagree with Axiora's read, but you'll be asked for a reason so it's
        on record. When you've decided, mark it decided, and later note how it turned
        out.
      </p>
    </HelpShell>
  );
}
