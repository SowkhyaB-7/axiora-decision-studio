import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";
import { helpMeta } from "@/lib/help-meta";

export const Route = createFileRoute("/help/contact")({
  head: () =>
    helpMeta(
      "Contact",
      "Get in touch if you have a question, spot something that does not look right, or want to share feedback.",
    ),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Contact" crumb="Contact" showBackLink>
      <p className="lead">
        Axiora is built by one person, so you'll hear back from them directly.
      </p>
      <p>
        If you have a question, spot something that doesn't look right, or want to share
        feedback, email{" "}
        <a href="mailto:sowkhyabovindala7@gmail.com">sowkhyabovindala7@gmail.com</a> or
        reach out on{" "}
        <a
          href="https://www.linkedin.com/in/sowkhya-bovindala/"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
        .
      </p>
      <p>
        It helps to mention what you were trying to do and what you expected to happen.
        The <Link to="/help/faq">FAQ</Link> may also have a quick answer.
      </p>
    </HelpShell>
  );
}
