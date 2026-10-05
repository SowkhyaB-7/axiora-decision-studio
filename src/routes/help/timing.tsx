import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/timing")({
  head: () =>
    helpMeta(
      "Timing and Next Steps",
      "How Axiora handles timing and turns a larger goal into something you can act on next.",
    ),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Timing and Next Steps" crumb="Timing and Next Steps" showBackLink>
      <p className="lead">
        Axiora only treats something as urgent when you've said it is.
      </p>

      <h2>Deadlines come from your words</h2>
      <p>
        Phrases like "by Friday", "tomorrow at 3pm", "Oct 20", or "in 30 minutes" are
        saved as deadlines. Vague phrases like "next month" or "soon" aren't, so the card
        says No deadline. Axiora won't make one up.
      </p>

      <h2>Labels that keep up with the clock</h2>
      <p>
        Cards say things like "Due today at 3:00 PM", "Due next Tuesday", or "Overdue by
        2 days". These update as time passes, in your own time zone. A deadline without a
        time counts as due until the end of that day.
      </p>

      <h2>Changing a deadline</h2>
      <p>
        Open a card to add, change, or remove a deadline. A date you set yourself is
        marked "(set by you)" and stays put even if you edit the request.
      </p>

      <h2>Next steps</h2>
      <p>
        For each piece of work, Axiora suggests a short approach and one next action.
        These are suggestions, labelled that way, and you can adjust them.
      </p>

      <h2>Filtering and sorting</h2>
      <p>
        Use Filter to see work that's overdue, due soon, due this week, due later, or
        has no deadline. Use Sort to order by due date.
      </p>
    </HelpShell>
  );
}
