import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/workstreams")({
  head: () =>
    helpMeta(
      "Workstreams",
      "How Axiora organizes work without asking you to manage the structure yourself.",
    ),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Workstreams" crumb="Workstreams" showBackLink>
      <p className="lead">
        Workstreams help you see related work together. You don't create or maintain
        them.
      </p>

      <h2>How they appear</h2>
      <p>
        When you add work, Axiora places it in a workstream such as Product,
        Engineering, Marketing, Sales, Finance, Operations, General, or Decisions. A
        workstream only shows up once there's work in it.
      </p>

      <h2>Moving between them</h2>
      <p>
        The pills above your workspace let you look at everything or one workstream at a
        time. If you edit a request and it now belongs somewhere else, it moves on its
        own.
      </p>

      <h2>What they're not</h2>
      <p>
        Workstreams aren't projects, and they aren't the main way to use Axiora. They're
        a light layer of organization so a busy workspace stays readable.
      </p>
    </HelpShell>
  );
}
