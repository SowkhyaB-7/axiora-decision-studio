import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Compass,
  ScrollText,
  Sparkles,
  Layers,
  Building2,
  Shield,
  Info,
  ClipboardList,
  MessageCircleQuestion,
  Mail,
  FileText,
} from "lucide-react";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/")({
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
        description: "Create your first Decision Board and run your first analysis.",
        icon: Sparkles,
      },
      {
        to: "/help/core-concepts",
        title: "Core Concepts",
        description:
          "The terms Axiora uses — Board, Evidence, Dimension, Readiness, Confidence.",
        icon: Compass,
      },
    ],
  },
  {
    title: "How Axiora Works",
    cards: [
      {
        to: "/help/decision-framework",
        title: "Decision Framework",
        description: "Why five dimensions exist, and exactly how readiness is scored.",
        icon: Layers,
      },
      {
        to: "/help/user-guide",
        title: "User Guide",
        description: "Every feature, what it does, and its current limits.",
        icon: BookOpen,
      },
      {
        to: "/help/architecture",
        title: "Architecture",
        description: "How the app is built, end to end — frontend, database, deployment.",
        icon: Building2,
      },
    ],
  },
  {
    title: "About This Version",
    cards: [
      {
        to: "/help/about",
        title: "About Axiora",
        description: "Why Axiora exists, who it's for, and what's in scope today.",
        icon: Info,
      },
      {
        to: "/help/product-principles",
        title: "Product Principles",
        description: "The judgment calls behind how Axiora is designed.",
        icon: Shield,
      },
      {
        to: "/help/limitations",
        title: "Known Limitations",
        description: "What v1.0 intentionally doesn't do yet.",
        icon: ClipboardList,
      },
      {
        to: "/help/release-notes",
        title: "Release Notes",
        description: "What shipped in v1.0.0.",
        icon: ScrollText,
      },
    ],
  },
  {
    title: "Support",
    cards: [
      {
        to: "/help/faq",
        title: "FAQ",
        description: "Common questions, answered directly.",
        icon: MessageCircleQuestion,
      },
      {
        to: "/help/contact",
        title: "Contact",
        description: "How to reach out with a question or bug report.",
        icon: Mail,
      },
      {
        to: "/help/legal",
        title: "Legal",
        description: "Where privacy and terms information will live.",
        icon: FileText,
      },
    ],
  },
];

function HelpIndex() {
  return (
    <HelpShell title="Help Center" crumb="Help Center">
      <p className="lead">
        Everything Axiora does today — how the product is designed, how readiness is
        scored, and what v1.0 intentionally leaves out.
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
