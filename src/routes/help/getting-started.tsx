import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/getting-started")({
  head: () =>
    helpMeta(
      "Getting Started",
      "How to start with Axiora and turn something you are trying to accomplish into a useful next step.",
    ),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Getting Started" crumb="Getting Started" showBackLink>
      <p className="lead">
        Axiora starts with one question: what are you trying to accomplish? You don't
        need to set anything up first.
      </p>

      <h2>Your first few minutes</h2>
      <ol>
        <li>Create an account with your email and password, then sign in.</li>
        <li>
          On your workspace, type what you are trying to get done in the box at the top.
          Write it the way you would say it to a colleague.
        </li>
        <li>
          Press Enter. Axiora reads it, places it in a workstream, and suggests a first
          step.
        </li>
        <li>Open the card to see what Axiora understood and what it suggests.</li>
      </ol>

      <h2>What you'll see</h2>
      <p>
        Each piece of work shows up as a small card. Some cards are ready to act on. Some
        ask you a quick question first. Some point out that something might be holding
        the work up. If what you wrote is really a choice you need to make, Axiora
        treats it as a decision and offers a Decision Briefing.
      </p>

      <h2>A few things to try</h2>
      <ul>
        <li>"Fix the checkout bug before Friday"</li>
        <li>"Prepare for the board meeting"</li>
        <li>"Launch the pricing page once legal is ready"</li>
        <li>"Should we launch enterprise SSO now?"</li>
      </ul>
      <p>
        Each of these gets a different kind of help. You can read why in{" "}
        <Link to="/help/understanding-work">How Axiora Understands Work</Link>.
      </p>
    </HelpShell>
  );
}
