import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Compass,
  Sparkles,
  Layers,
  Shield,
  Info,
  ClipboardList,
  MessageCircleQuestion,
  Mail,
  FileText,
  Network,
  Clock,
  Scale,
  History,
} from "lucide-react";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/")({
  head: () => ({
    meta: [
      { title: "Help Center | Axiora" },
      {
        name: "description",
        content:
          "Learn how Axiora works, how to get the most out of it, and what the current version can and cannot do.",
      },
      { property: "og:title", content: "Help Center | Axiora" },
      {
        property: "og:description",
        content: "How Axiora turns what you are trying to accomplish into clear next steps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpIndex,
});

type Card = {
  to: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const groups: { title: string; cards: Card[] }[] = [
  {
    title: "Start Here",
    cards: [
      {
        to: "/help/getting-started",
        title: "Getting Started",
        description:
          "Learn how to start with Axiora and turn something you are trying to accomplish into a useful next step.",
        icon: Sparkles,
      },
      {
        to: "/help/how-to-work",
        title: "How to Work with Axiora",
        description:
          "Learn how to describe what you are trying to accomplish and how Axiora works from there.",
        icon: BookOpen,
      },
      {
        to: "/help/core-concepts",
        title: "Core Concepts",
        description:
          "Understand the ideas behind Axiora, including work, next steps, evidence, decisions, and uncertainty.",
        icon: Compass,
      },
    ],
  },
  {
    title: "How Axiora Works",
    cards: [
      {
        to: "/help/understanding-work",
        title: "How Axiora Understands Work",
        description:
          "See how Axiora interprets what you give it and decides what kind of help you need.",
        icon: Network,
      },
      {
        to: "/help/workstreams",
        title: "Workstreams",
        description:
          "Learn how Axiora organizes work without asking you to manage the structure yourself.",
        icon: Layers,
      },
      {
        to: "/help/timing",
        title: "Timing and Next Steps",
        description:
          "See how Axiora handles timing and turns a larger goal into something you can act on next.",
        icon: Clock,
      },
      {
        to: "/help/decisions-evidence",
        title: "Decisions and Evidence",
        description:
          "Learn how Axiora handles decisions, evidence, uncertainty, and conflicting information.",
        icon: Scale,
      },
    ],
  },
  {
    title: "About This Version",
    cards: [
      {
        to: "/help/about",
        title: "About Axiora",
        description: "Who made Axiora, and why.",
        icon: Info,
      },
      {
        to: "/help/product-principles",
        title: "Product Principles",
        description: "Understand the thinking behind the way Axiora is designed.",
        icon: Shield,
      },
      {
        to: "/help/limitations",
        title: "Known Limitations",
        description:
          "What Axiora does not do yet and where you should still use your own judgment.",
        icon: ClipboardList,
      },
      {
        to: "/help/whats-new",
        title: "What's New in V2",
        description: "See how Axiora has evolved from the earlier version.",
        icon: History,
      },
    ],
  },
  {
    title: "Support",
    cards: [
      {
        to: "/help/faq",
        title: "FAQ",
        description: "Answers to common questions about using Axiora.",
        icon: MessageCircleQuestion,
      },
      {
        to: "/help/contact",
        title: "Contact",
        description:
          "Get in touch if you have a question, spot something that does not look right, or want to share feedback.",
        icon: Mail,
      },
      {
        to: "/help/legal",
        title: "Legal",
        description: "Privacy, terms, and other important information.",
        icon: FileText,
      },
    ],
  },
];

function HelpIndex() {
  return (
    <HelpShell title="Help Center" crumb="Help Center">
      <p className="lead">
        Learn how Axiora works, how to get the most out of it, and what the current
        version can and cannot do.
      </p>

      <div className="mt-10 space-y-10">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {group.cards.map((card) => (
                <Link
                  key={card.to}
                  to={card.to}
                  className="group flex gap-3 rounded-lg border border-border bg-surface p-4 transition hover:border-accent/50 hover:bg-surface-muted"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-surface-muted text-foreground group-hover:bg-accent/10 group-hover:text-accent">
                    <card.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">{card.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {card.description}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </HelpShell>
  );
}
