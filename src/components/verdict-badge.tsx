import { AlertTriangle, CheckCircle2, CircleDashed, Gavel, HelpCircle, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { VERDICT_LABEL, type Confidence, type Verdict } from "@/lib/verdict";

const TONE: Record<Verdict, string> = {
  INSUFFICIENT_EVIDENCE: "bg-muted text-muted-foreground border-border",
  EVIDENCE_CONFLICT: "bg-destructive/10 text-destructive border-destructive/25",
  NOT_READY: "bg-destructive/10 text-destructive border-destructive/25",
  ALMOST_READY: "bg-info/10 text-info border-info/25",
  READY: "bg-success/10 text-success border-success/25",
  DECIDED: "bg-primary/10 text-primary border-primary/25",
};

const ICON: Record<Verdict, typeof Scale> = {
  INSUFFICIENT_EVIDENCE: HelpCircle,
  EVIDENCE_CONFLICT: Scale,
  NOT_READY: AlertTriangle,
  ALMOST_READY: CircleDashed,
  READY: CheckCircle2,
  DECIDED: Gavel,
};

export function VerdictBadge({
  verdict,
  className,
  size = "md",
}: {
  verdict: Verdict;
  className?: string;
  size?: "sm" | "md";
}) {
  const Icon = ICON[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        TONE[verdict],
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

export function ConfidenceChip({ confidence }: { confidence: Confidence }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      Confidence
      <span className="font-medium text-foreground">{confidence}</span>
    </span>
  );
}
