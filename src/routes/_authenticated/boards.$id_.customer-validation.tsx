import { createFileRoute } from "@tanstack/react-router";
import { DimensionPage } from "@/components/dimension-page";

export const Route = createFileRoute(
  "/_authenticated/boards/$id_/customer-validation",
)({
  head: () => ({
    meta: [{ title: "Customer Validation — Axiora" }],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <DimensionPage boardId={id} dimensionKey="customer_validation" />;
}
