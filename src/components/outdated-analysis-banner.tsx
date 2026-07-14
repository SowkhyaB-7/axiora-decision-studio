import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  boardId: string;
};

/**
 * Banner shown when evidence has changed since the last completed analysis,
 * prompting the user to re-run the analysis.
 */
export function OutdatedAnalysisBanner({ boardId }: Props) {
  const { data } = useQuery({
    queryKey: ["board-analysis-status", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decision_boards")
        .select("analysis_status")
        .eq("id", boardId)
        .maybeSingle();
      if (error) throw error;
      return data?.analysis_status ?? null;
    },
  });

  if (data !== "Outdated") return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div>
        <div className="font-medium">Evidence has been updated.</div>
        <div className="text-muted-foreground">
          Re-run analysis to refresh recommendations. Previous analyses remain
          available in Decision History.
        </div>
      </div>
    </div>
  );
}
