import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { EvidenceSection } from "@/components/evidence-section";
import { ArrowLeft, Users } from "lucide-react";

export const Route = createFileRoute(
  "/_authenticated/boards/$id_/customer-validation",
)({
  head: () => ({
    meta: [{ title: "Customer Validation — Axiora" }],
  }),
  component: CustomerValidation,
});

function CustomerValidation() {
  const { id: boardId } = Route.useParams();
  return (
    <AppShell
      title="Customer Validation"
      subtitle="Evidence from interviews, feedback, and usage"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          to="/boards/$id"
          params={{ id: boardId }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to board
        </Link>

        <EvidenceSection
          boardId={boardId}
          dimensionName="customer_validation"
          title="Customer Validation"
          description="Collect interviews, usage signals, feedback, and other proof that validates customer demand."
          icon={<Users className="h-6 w-6 text-accent" />}
        />
      </div>
    </AppShell>
  );
}
