import { createFileRoute } from "@tanstack/react-router";
import { HelpShell } from "@/components/help-shell";

export const Route = createFileRoute("/help/product-principles")({
  head: () => ({ meta: [{ title: "Product Principles — Axiora Help Center" }] }),
  component: Page,
});

function Page() {
  return (
    <HelpShell title="Product Principles" crumb="Product Principles" showBackLink>
      <h2>Evidence before opinion</h2>
      <p>
        A readiness assessment is built from logged, dated evidence — not from how
        confident someone feels in the moment.
      </p>

      <h2>Explainable over opaque</h2>
      <p>
        Every score traces back to specific evidence you can see. Readiness Analysis is
        deliberately deterministic rather than an AI model, precisely so it stays
        auditable.
      </p>

      <h2>One board = one decision</h2>
      <p>
        A board frames exactly one decision. Evidence isn't pooled across decisions, and
        readiness is never averaged across boards.
      </p>

      <h2>Decisions should be auditable</h2>
      <p>
        Recording a decision is a deliberate, visible action. The evidence and analyses
        behind it remain in place afterward.
      </p>

      <h2>Preserve historical analyses</h2>
      <p>
        Running a new analysis never overwrites a previous one — it adds a new version.
      </p>

      <h2>Simplicity over feature bloat</h2>
      <p>
        Version 1.0 supports one decision type, one owner per board, and a fixed
        five-dimension framework — deliberately, not as a placeholder.
      </p>

      <h2>Transparent reasoning</h2>
      <p>
        Where a feature is a label without a function yet — like board templates or the
        visibility setting — Axiora's own documentation says so.
      </p>
    </HelpShell>
  );
}
