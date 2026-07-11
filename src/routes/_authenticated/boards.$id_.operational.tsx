import { createFileRoute } from "@tanstack/react-router";
import { DimensionPage } from "@/components/dimension-page";

export const Route = createFileRoute("/_authenticated/boards/$id_/operational")({
  head: () => ({
    meta: [{ title: "Operational Readiness — Axiora" }],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <DimensionPage boardId={id} dimensionKey="operational" />;
}
