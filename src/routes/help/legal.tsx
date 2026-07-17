import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/legal")({
  head: () => ({ meta: [{ title: "Legal — Axiora Help Center" }] }),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Legal" crumb="Legal" showBackLink>
      <p className="lead">
        Axiora does not yet have published Privacy Policy or Terms of Service pages.
      </p>
      <p>
        Account data is stored in Supabase and is only accessible to the account that
        created it, enforced by Row Level Security.
      </p>
    </HelpShell>
  );
}
