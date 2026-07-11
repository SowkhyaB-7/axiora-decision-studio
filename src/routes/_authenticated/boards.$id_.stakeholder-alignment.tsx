import { createFileRoute } from "@tanstack/react-router";
import { DimensionPage } from "@/components/dimension-page";

export const Route = createFileRoute(
  "/_authenticated/boards/$id_/stakeholder-alignment",
)({
  head: () => ({
    meta: [{ title: "Stakeholder Alignment — Axiora" }],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <DimensionPage boardId={id} dimensionKey="stakeholder_alignment" />;
}
