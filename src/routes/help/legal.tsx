import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/legal")({
  head: () => helpMeta("Legal", "Privacy, terms, and other important information."),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Legal" crumb="Legal" showBackLink>
      <p className="lead">
        Axiora doesn't have a published privacy policy or terms of service yet.
      </p>
      <p>
        Your work, evidence, and files are tied to your account and aren't shown to other
        users. What you write is sent to an AI model so Axiora can interpret it. Please
        avoid adding sensitive or confidential information while Axiora is at this early
        stage.
      </p>
    </HelpShell>
  );
}
