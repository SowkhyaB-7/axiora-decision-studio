import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let initialized = false;

export default function MermaidInner({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        securityLevel: "strict",
      });
      initialized = true;
    }
    const id = `mmd-${Math.random().toString(36).slice(2, 10)}`;
    mermaid
      .render(id, chart)
      .then(({ svg }) => setSvg(svg))
      .catch((err) => {
        console.error("Mermaid render error", err);
        setSvg("");
      });
  }, [chart]);

  return (
    <div
      ref={ref}
      className="mermaid-container overflow-x-auto text-sm [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
