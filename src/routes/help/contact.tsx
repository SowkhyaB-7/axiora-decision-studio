import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/contact")({
  head: () => ({ meta: [{ title: "Contact — Axiora Help Center" }] }),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Contact" crumb="Contact" showBackLink>
      <p className="lead">
        Axiora is an early, single-developer product. There's no support team yet, but
        questions, bug reports, and feedback are welcome via the project's GitHub
        repository issues page.
      </p>
      <p>
        Before reaching out, check the <Link to="/help/faq">FAQ</Link>, the{" "}
        <Link to="/help/user-guide">User Guide</Link>, and{" "}
        <Link to="/help/release-notes">Release Notes</Link> for common questions and
        current scope.
      </p>
    </HelpShell>
  );
}
