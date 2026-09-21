import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MODES } from "@/lib/work";

const goalSchema = z.string().trim().min(3).max(4000);

export const interpretGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ goal: goalSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { interpretGoalText } = await import("@/lib/ai.server");
    const interpreted = await interpretGoalText(data.goal);

    let decisionId: string | null = null;
    if (interpreted.mode === "DECISION") {
      const { data: decision, error: decisionError } = await context.supabase
        .from("decisions")
        .insert({
          owner_id: context.userId,
          title: interpreted.title,
          context: interpreted.description ?? data.goal,
        })
        .select("id")
        .single();
      if (decisionError) throw decisionError;
      decisionId = decision.id;
    }

    const { data: row, error } = await context.supabase
      .from("work_items")
      .insert({
        owner_id: context.userId,
        raw_goal: data.goal,
        title: interpreted.title,
        description: interpreted.description,
        workstream: interpreted.workstream,
        status: interpreted.mode === "DEPENDENCY" ? "BLOCKED" : interpreted.urgency,
        mode: interpreted.mode,
        steps: interpreted.steps,
        next_action: interpreted.nextAction,
        blocker_label: interpreted.possibleBlocker,
        blocker_confirmed: interpreted.mode === "DEPENDENCY" ? null : false,
        clarifying_question: interpreted.clarifyingQuestion,
        clarifying_options: interpreted.clarifyingOptions,
        ai_reasoning: interpreted.reasoning,
        decision_id: decisionId,
      })
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

export const clarifyWorkItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ itemId: z.string().uuid(), answer: z.string().trim().min(1).max(1000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: current, error: readError } = await context.supabase
      .from("work_items")
      .select("raw_goal, mode")
      .eq("id", data.itemId)
      .maybeSingle();
    if (readError) throw readError;
    if (!current) throw new Error("Work item not found");

    const { interpretGoalText } = await import("@/lib/ai.server");
    const interpreted = await interpretGoalText(current.raw_goal, data.answer);
    let decisionId: string | null = null;
    if (interpreted.mode === "DECISION") {
      const { data: decision, error: decisionError } = await context.supabase
        .from("decisions")
        .insert({
          owner_id: context.userId,
          title: interpreted.title,
          context: interpreted.description ?? current.raw_goal,
        })
        .select("id")
        .single();
      if (decisionError) throw decisionError;
      decisionId = decision.id;
    }

    const { data: row, error } = await context.supabase
      .from("work_items")
      .update({
        title: interpreted.title,
        description: interpreted.description,
        workstream: interpreted.workstream,
        status: interpreted.mode === "DEPENDENCY" ? "BLOCKED" : interpreted.urgency,
        mode: interpreted.mode,
        steps: interpreted.steps,
        next_action: interpreted.nextAction,
        blocker_label: interpreted.possibleBlocker,
        blocker_confirmed: interpreted.mode === "DEPENDENCY" ? null : false,
        clarifying_answer: data.answer,
        clarifying_question: interpreted.clarifyingQuestion,
        clarifying_options: interpreted.clarifyingOptions,
        ai_reasoning: interpreted.reasoning,
        decision_id: decisionId,
      })
      .eq("id", data.itemId)
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

export const correctWorkItemMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ itemId: z.string().uuid(), mode: z.enum(MODES) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: current, error: readError } = await context.supabase
      .from("work_items")
      .select("title, raw_goal, description, mode, user_corrections, decision_id")
      .eq("id", data.itemId)
      .maybeSingle();
    if (readError) throw readError;
    if (!current) throw new Error("Work item not found");

    let decisionId = current.decision_id;
    if (data.mode === "DECISION" && !decisionId) {
      const { data: decision, error: decisionError } = await context.supabase
        .from("decisions")
        .insert({
          owner_id: context.userId,
          title: current.title,
          context: current.description ?? current.raw_goal,
        })
        .select("id")
        .single();
      if (decisionError) throw decisionError;
      decisionId = decision.id;
    }

    const corrections = Array.isArray(current.user_corrections)
      ? current.user_corrections
      : [];
    const { data: row, error } = await context.supabase
      .from("work_items")
      .update({
        mode: data.mode,
        status: data.mode === "DEPENDENCY" ? "BLOCKED" : "NEXT",
        blocker_confirmed: data.mode === "DEPENDENCY" ? null : false,
        decision_id: decisionId,
        user_corrections: [
          ...corrections,
          { from: current.mode, to: data.mode, at: new Date().toISOString() },
        ],
      })
      .eq("id", data.itemId)
      .select("*")
      .single();
    if (error) throw error;
    return row;
  });

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
