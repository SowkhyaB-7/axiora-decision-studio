import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/understanding-work")({
  head: () =>
    helpMeta(
      "How Axiora Understands Work",
      "How Axiora interprets what you give it and decides what kind of help you need.",
    ),
  component: Page,
});

function Page() {
  return (
    <HelpShell
      title="How Axiora Understands Work"
      crumb="How Axiora Understands Work"
      showBackLink
    >
      <p className="lead">
        You never pick a mode. Axiora reads what you wrote and decides what kind of help
        makes sense. Broadly, work falls into one of four patterns.
      </p>

      <h2>Simple work</h2>
      <p>
        The goal is clear enough to act on. Axiora suggests a short approach and a next
        step. Example: "Update the launch documentation."
      </p>

      <h2>Ambiguous work</h2>
      <p>
        The goal could mean a few different things, and the difference matters. Axiora
        asks one short question, often with a few options to pick from. Example:
        "Prepare for the board meeting."
      </p>

      <h2>Blocked or dependent work</h2>
      <p>
        The work seems to depend on something else first. Axiora points this out as a
        possible blocker and asks you to confirm it, since it's a guess. Example:
        "Launch the pricing page once legal is ready."
      </p>

      <h2>Decision work</h2>
      <p>
        You're weighing a choice rather than doing a task. Axiora opens a Decision
        Briefing where you can gather evidence. Example: "Should we launch enterprise
        SSO now?"
      </p>

      <h2>If it gets it wrong</h2>
      <p>
        Open the card and correct it, or edit the request. Axiora will read it again and
        update the card in place.
      </p>
    </HelpShell>
  );
}
