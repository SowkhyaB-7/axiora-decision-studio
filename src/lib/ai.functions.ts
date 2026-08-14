import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const extractEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ rawText: z.string().min(1).max(20000), decisionId: z.string().uuid() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { extractEvidenceFromText } = await import("@/lib/ai.server");
    const { data: decision, error } = await context.supabase
      .from("decisions")
      .select("title")
      .eq("id", data.decisionId)
      .maybeSingle();
    if (error) throw error;
    if (!decision) throw new Error("Decision not found");
    return extractEvidenceFromText(data.rawText, decision.title);
  });

export const getBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ decisionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { loadAndBuildBriefing } = await import("@/lib/ai.server");
    return loadAndBuildBriefing(context.supabase, data.decisionId);
  });
