import { createElement } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EvidenceSection } from "@/components/evidence-section";
import { DIMENSIONS_BY_KEY, type DimensionKey } from "@/lib/dimensions";

type Props = {
  boardId: string;
  dimensionKey: DimensionKey;
};

/**
 * Configuration-driven page that powers every readiness dimension.
 * Reuses the shared EvidenceSection for CRUD, attachments, signed URLs,
 * and validation.
 */
export function DimensionPage({ boardId, dimensionKey }: Props) {
  const cfg = DIMENSIONS_BY_KEY[dimensionKey];
  return (
    <AppShell
      title={cfg.name}
      subtitle="Evidence collection & readiness signals"
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
          dimensionName={cfg.key}
          title={cfg.name}
          description={cfg.desc}
          icon={createElement(cfg.icon, { className: "h-6 w-6 text-accent" })}
        />
      </div>
    </AppShell>
  );
}
