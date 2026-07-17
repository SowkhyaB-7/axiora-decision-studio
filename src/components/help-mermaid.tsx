import { lazy, Suspense } from "react";

const MermaidInner = lazy(() => import("./help-mermaid-inner"));

export function HelpMermaid({ chart, caption }: { chart: string; caption?: string }) {
  return (
    <figure className="my-6 rounded-lg border border-border bg-surface p-4">
      <Suspense
        fallback={
          <div className="grid h-48 place-items-center text-xs text-muted-foreground">
            Loading diagram…
          </div>
        }
      >
        <MermaidInner chart={chart} />
      </Suspense>
      {caption && (
        <figcaption className="mt-3 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
