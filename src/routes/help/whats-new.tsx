import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/whats-new")({
  head: () =>
    helpMeta("What's New in V2", "How Axiora has evolved from the earlier version."),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="What's New in V2" crumb="What's New in V2" showBackLink>
      <p className="lead">
        The first version of Axiora was built around one kind of work: preparing a
        launch decision. V2 starts somewhere broader.
      </p>

      <h2>Where it started</h2>
      <p>
        V1 asked you to create a decision board, sort evidence into fixed categories, and
        run an analysis that produced scores. It was useful for that one job, but it
        asked for a lot of structure before it could help.
      </p>

      <h2>What changed</h2>
      <ul>
        <li>V2 begins with what you're trying to accomplish, in your own words.</li>
        <li>
          It handles everyday work, unclear work, and work that depends on something
          else, not only decisions.
        </li>
        <li>Work is organized into workstreams automatically.</li>
        <li>Timing is read from what you write, and nothing urgent is invented.</li>
        <li>What you said, what Axiora infers, and what it suggests are kept apart.</li>
        <li>You can attach files to work, complete it, and reopen it later.</li>
      </ul>

      <h2>What happened to decisions</h2>
      <p>
        They're still here, as the Decision Briefing. It now opens when a request is
        actually a decision. Numeric scores are gone. Instead, Axiora describes how
        confident it is in plain language and shows you when evidence conflicts.
      </p>

      <h2>Why</h2>
      <p>
        Most of what people bring to work isn't a neat decision. It's half formed. V2
        tries to meet it there.
      </p>
    </HelpShell>
  );
}
