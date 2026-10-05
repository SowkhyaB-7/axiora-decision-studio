import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/about")({
  head: () => ({
    meta: [
      { title: "About Axiora — Created by Sowkhya Bovindala" },
      {
        name: "description",
        content:
          "Axiora is an independent product exploration by Sowkhya Bovindala: an AI-native workspace for moving from messy intentions to clearer decisions.",
      },
      { property: "og:title", content: "About Axiora — Created by Sowkhya Bovindala" },
      {
        property: "og:description",
        content:
          "Who created Axiora, and why: an AI-native workspace for clearer decisions and meaningful next actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const background = [
  "Electronics & Communication Engineering",
  "Global MBA — University of Western Australia",
  "IIM Kozhikode — Professional Certificate Programme",
  "CSPO Certified",
];

function Page() {
  return (
    <HelpShell
      eyebrow="About Axiora"
      title="Created by Sowkhya Bovindala"
      crumb="About Axiora"
      showBackLink
    >
      <div className="max-w-xl space-y-8 text-[15px] leading-relaxed text-foreground/85">
        <p>
          I’m a product builder with a background in engineering and product management,
          interested in how AI can make complex work easier to understand and act on.
        </p>

        <div>
          <p>I started building Axiora to explore a simple idea:</p>
          <blockquote className="mt-5 border-l-2 border-primary/60 pl-5 font-display text-2xl leading-snug text-foreground md:text-[1.7rem]">
            “What if you could tell AI what you’re trying to accomplish without first
            having to organize the work yourself?”
          </blockquote>
        </div>

        <p>
          Axiora is my exploration of that idea — an AI-native workspace designed to help
          people move from messy intentions to clearer decisions and meaningful next
          actions, without adding another layer of process.
        </p>

        <section className="border-t border-border pt-8">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Background
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-foreground/85">
            {background.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>

        <section>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Focus
          </div>
          <p className="mt-3 text-sm">Product · AI · LLMs</p>
        </section>

        <section>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Contact
          </div>
          <p className="mt-3 text-sm">
            <a
              href="mailto:sowkhyabovindala7@gmail.com"
              className="text-primary underline-offset-4 hover:underline"
            >
              Email
            </a>
            <span className="mx-2 text-muted-foreground">·</span>
            <a
              href="https://www.linkedin.com/in/sowkhya-bovindala/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              LinkedIn
            </a>
          </p>
        </section>
      </div>
    </HelpShell>
  );
}
