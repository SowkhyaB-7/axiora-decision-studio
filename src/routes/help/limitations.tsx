import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/limitations")({
  head: () =>
    helpMeta(
      "Known Limitations",
      "What Axiora does not do yet and where you should still use your own judgment.",
    ),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Known Limitations" crumb="Known Limitations" showBackLink>
      <p className="lead">
        Axiora is an early, independent product. It's useful, but it isn't finished, and
        it isn't a replacement for your judgment.
      </p>

      <h2>The AI can be wrong</h2>
      <ul>
        <li>It may place work in the wrong workstream or misread what you meant.</li>
        <li>Suggested steps are a starting point. Check them before relying on them.</li>
        <li>Evidence pulled from documents can miss or misread details.</li>
        <li>The same request may not always get exactly the same response.</li>
      </ul>

      <h2>It doesn't act for you</h2>
      <ul>
        <li>Axiora suggests. It doesn't send messages, update other tools, or finish work on its own.</li>
        <li>It never marks work completed without you.</li>
      </ul>

      <h2>Working alone, for now</h2>
      <ul>
        <li>No sharing, teammates, or comments.</li>
        <li>No integrations with other tools and no data export.</li>
      </ul>

      <h2>Files</h2>
      <ul>
        <li>Only PDF, Word (DOCX), and text files, up to 10 MB each.</li>
        <li>Files attached to work items are stored for reference, not analyzed.</li>
        <li>No in-app preview. You can open or download the original.</li>
      </ul>

      <h2>Timing</h2>
      <ul>
        <li>Only clear dates and times are understood. Vague phrases are left as No deadline.</li>
        <li>No reminders or notifications.</li>
      </ul>

      <h2>Early stage</h2>
      <p>
        Axiora hasn't been tested at scale. Please don't use it as the only place you
        keep important or sensitive information.
      </p>
    </HelpShell>
  );
}
