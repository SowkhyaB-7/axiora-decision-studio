import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — Axiora" },
      {
        name: "description",
        content:
          "The Axiora Help Center — how Decision Boards, evidence, and readiness analysis work in v1.0.",
      },
      { property: "og:title", content: "Help Center — Axiora" },
      {
        property: "og:description",
        content:
          "How Axiora prepares Product Managers to make evidence-driven launch decisions.",
      },
    ],
  }),
  component: () => <Outlet />,
});
