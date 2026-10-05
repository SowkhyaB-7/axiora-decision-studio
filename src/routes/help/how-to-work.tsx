import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/how-to-work")({
  head: () =>
    helpMeta(
      "How to Work with Axiora",
      "How to describe what you are trying to accomplish and how Axiora works from there.",
    ),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="How to Work with Axiora" crumb="How to Work with Axiora" showBackLink>
      <p className="lead">
        You don't have to be precise. Say what you're after, and add detail when it
        helps.
      </p>

      <h2>Describe the goal, not the plan</h2>
      <p>
        "Get the onboarding emails ready for launch" is enough. You don't need to break
        it into tasks or pick a category. Axiora suggests a way to approach it, and you
        can change anything that doesn't fit.
      </p>

      <h2>Mention timing if it's real</h2>
      <p>
        If something is due, say so: "by Friday", "tomorrow at 3pm", "in 2 hours".
        If you don't mention timing, Axiora won't invent a deadline. You can add one
        later from the card.
      </p>

      <h2>Answer questions when they come up</h2>
      <p>
        Sometimes Axiora asks one short question because the answer changes what it
        would suggest. It won't ask for details it doesn't need.
      </p>

      <h2>Keep working from the card</h2>
      <ul>
        <li>Edit the request if you meant something different. Axiora reads it again.</li>
        <li>Correct how it understood the work, or confirm a possible blocker.</li>
        <li>Change, add, or remove a deadline.</li>
        <li>Attach supporting files (PDF, Word, or text).</li>
        <li>Mark it as completed, or reopen it later from the Completed view.</li>
      </ul>
    </HelpShell>
  );
}
