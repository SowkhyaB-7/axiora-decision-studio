import type { Briefing } from "@/lib/briefing";
import { MODES, URGENCIES, type Mode, type Urgency } from "@/lib/work";
import {
  CATEGORIES,
  DIRECTIONS,
  STRENGTHS,
  VERDICT_LABEL,
  type Category,
  type Confidence,
  type Direction,
  type EvidenceItem,
  type Strength,
  type Verdict,
} from "@/lib/verdict";

const MODEL = "google/gemini-2.5-flash";
const ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

const GUARDRAILS = `Hard rules you must obey:
- Use ONLY the information given to you in this request.
- Never invent evidence, sources, dates, names, numbers or customer quotes.
- Never introduce facts that are not present in the supplied text.
- If something is unclear or absent, say so plainly or leave it out.
- Never produce numeric scores, percentages or ratings.
- Respond with raw JSON only. No markdown, no code fences, no commentary.`;

async function callModel(
  system: string,
  user: string,
): Promise<Record<string, unknown>> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: `${system}\n\n${GUARDRAILS}` },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content ?? "";
  return parseJsonObject(content);
}

function parseJsonObject(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Malformed AI response");
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Malformed AI response");
  }
  return parsed as Record<string, unknown>;
}

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

function pickEnum<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  const s = str(v);
  if (!s) return null;
  const up = s.toUpperCase();
  return (allowed as readonly string[]).includes(up) ? (up as T) : null;
}

const stringArray = (value: unknown, limit: number): string[] =>
  (Array.isArray(value) ? value : [])
    .map((item) => str(item))
    .filter((item): item is string => item !== null)
    .slice(0, limit);

export type GoalInterpretation = {
  mode: Mode;
  title: string;
  description: string | null;
  workstream: string;
  urgency: Urgency;
  steps: string[];
  nextAction: string | null;
  clarifyingQuestion: string | null;
  clarifyingOptions: string[];
  possibleBlocker: string | null;
  reasoning: string;
};

/**
 * Interprets a messy goal without pretending the classification is certain.
 * The returned reasoning is displayed as an inference and can be corrected.
 */
export async function interpretGoalText(
  rawGoal: string,
  clarification?: string,
): Promise<GoalInterpretation> {
  const system = `You are Axiora's work-intent interpreter. Decide the minimum useful help for a product manager's messy goal.

Classify into exactly one mode:
- SIMPLE: straightforward execution work. Give 3-5 concise steps and one immediate next action.
- AMBIGUOUS: the goal lacks one essential piece of context. Ask exactly one high-value question and give 3-4 short suggested answers. Do not invent a plan yet.
- DEPENDENCY: the goal is executable but a prerequisite or blocker is explicitly stated or strongly implied. Phrase it as a possible blocker, never a fact.
- DECISION: the user must choose among consequential options, often expressed as should/whether/go-no-go. Do not answer it or invent evidence.

Return JSON with exactly these keys:
{
  "mode": "SIMPLE" | "AMBIGUOUS" | "DEPENDENCY" | "DECISION",
  "title": concise work title, max 12 words,
  "description": one sentence using only the user's information, or null,
  "workstream": a concise domain emerging from the goal, such as Product, Security, Marketing, Sales, Operations, Engineering, Finance, or General,
  "urgency": "NOW" | "NEXT" | "LATER",
  "steps": 3-5 concise action steps for SIMPLE or a clarified goal; otherwise [],
  "next_action": one concrete immediate action for SIMPLE or clarified work; otherwise null,
  "clarifying_question": exactly one question for AMBIGUOUS; otherwise null,
  "clarifying_options": 3-4 short answer options for AMBIGUOUS; otherwise [],
  "possible_blocker": a concise possible prerequisite for DEPENDENCY; otherwise null,
  "reasoning": one short sentence explaining why this mode fits, phrased as an inference rather than certainty
}

Do not use a keyword-only heuristic. Consider whether the user can act, whether information is missing, whether another condition must be met, and whether a consequential choice is being made. Keep simple work simple.`;

  const user = clarification
    ? `Original goal: """${rawGoal.slice(0, 4000)}"""\n\nThe user answered Axiora's clarification with: """${clarification.slice(0, 1000)}"""\n\nInterpret the now-clarified goal. Do not return AMBIGUOUS unless one truly essential ambiguity still remains.`
    : `Goal from the user:\n"""${rawGoal.slice(0, 4000)}"""`;

  const data = await callModel(system, user);
  const mode = pickEnum(data["mode"], MODES);
  const title = str(data["title"]);
  if (!mode || !title) throw new Error("Axiora couldn't interpret that goal");

  return {
    mode,
    title,
    description: str(data["description"]),
    workstream: str(data["workstream"]) ?? "General",
    urgency: pickEnum(data["urgency"], URGENCIES) ?? "NEXT",
    steps: mode === "SIMPLE" ? stringArray(data["steps"], 5) : [],
    nextAction: mode === "SIMPLE" ? str(data["next_action"]) : null,
    clarifyingQuestion: mode === "AMBIGUOUS" ? str(data["clarifying_question"]) : null,
    clarifyingOptions:
      mode === "AMBIGUOUS" ? stringArray(data["clarifying_options"], 4) : [],
    possibleBlocker: mode === "DEPENDENCY" ? str(data["possible_blocker"]) : null,
    reasoning: str(data["reasoning"]) ?? "Axiora inferred this from the goal as written.",
  };
}

export type Extraction = {
  title: string | null;
  category: Category | null;
  direction: Direction | null;
  strength: Strength | null;
  takeaway: string | null;
  /** Field names the model was not confident about; left blank for the user. */
  uncertain: string[];
};

export async function extractEvidenceFromText(
  rawText: string,
  decisionTitle: string,
): Promise<Extraction> {
  const system = `You structure messy product-management notes into a single evidence record for a launch go/no-go decision.

Return JSON with exactly these keys:
{
  "title": short factual headline (max 12 words) or null,
  "category": "CUSTOMER" | "TECHNICAL" | "BUSINESS" or null,
  "direction": "SUPPORTS" | "CONTRADICTS" | "NEUTRAL" or null,
  "strength": "WEAK" | "MODERATE" | "STRONG" or null,
  "takeaway": one sentence stating only what the note actually says, or null,
  "uncertain": array of any of "title","category","direction","strength","takeaway" you could not determine confidently
}

Guidance:
- "direction" is relative to going ahead with the decision below: SUPPORTS means the note argues for it, CONTRADICTS means it argues against it, NEUTRAL means neither.
- "strength" reflects how much weight the note deserves: STRONG = first-hand, specific, multiple data points; MODERATE = credible but partial; WEAK = single anecdote, hearsay or vague.
- If the note is too thin to classify a field, set it to null and list the field in "uncertain". Do not guess.`;

  const user = `Decision under consideration: ${decisionTitle}

Note pasted by the product manager:
"""
${rawText.slice(0, 8000)}
"""`;

  const data = await callModel(system, user);

  const uncertainRaw = Array.isArray(data["uncertain"]) ? data["uncertain"] : [];
  const extraction: Extraction = {
    title: str(data["title"]),
    category: pickEnum(data["category"], CATEGORIES),
    direction: pickEnum(data["direction"], DIRECTIONS),
    strength: pickEnum(data["strength"], STRENGTHS),
    takeaway: str(data["takeaway"]),
    uncertain: uncertainRaw.filter((v): v is string => typeof v === "string"),
  };

  for (const [field, value] of Object.entries({
    title: extraction.title,
    category: extraction.category,
    direction: extraction.direction,
    strength: extraction.strength,
    takeaway: extraction.takeaway,
  })) {
    if (!value && !extraction.uncertain.includes(field)) {
      extraction.uncertain.push(field);
    }
  }

  return extraction;
}

export async function generateBriefingText(input: {
  decisionTitle: string;
  context: string | null;
  verdict: Verdict;
  confidence: Confidence;
  isConflict: boolean;
  uncoveredCategories: string[];
  evidence: EvidenceItem[];
}): Promise<Briefing> {
  const system = `You write the reasoning section of a decision briefing for a product manager. You do not decide the verdict; the verdict has already been computed by deterministic application rules and is given to you.

Return JSON with exactly these keys:
{
  "why": 2-4 sentences naming the actual tension in the evidence,
  "supports": [ { "claim": one short sentence, "evidence_refs": [evidence numbers] } ],
  "contradicts": [ { "claim": one short sentence, "evidence_refs": [evidence numbers] } ],
  "unresolved": one question capturing the open disagreement, or null if there is no disagreement,
  "missing": array of 1-3 specific pieces of evidence that could change or resolve THIS decision,
  "next_action": one concrete step to obtain a specific missing or conflict-resolving piece of evidence
}

Rules:
- Every claim must cite at least one real evidence number from the list. Never cite a number that is not listed.
- "contradicts" must contain only evidence marked CONTRADICTS. Leave it empty if there is none.
- "why" must describe the substance of the disagreement or gap. Never count or compare quantities of evidence ("two items support versus one against"), never mention strength ratings or the rules.
- "missing" is not a generic research wishlist: each entry must be evidence that would plausibly move this decision out of its current state, phrased as the specific thing to find out.
- "next_action" must be about obtaining or testing evidence (who to talk to, what to measure, what to prototype or verify), stated concretely. Never generic process language like "schedule a meeting", "align stakeholders" or "create a plan".
- If the verdict is EVIDENCE_CONFLICT, do not blend the two sides into a moderate view; describe each side plainly and set "unresolved".
- If the verdict is INSUFFICIENT_EVIDENCE, say explicitly that there is not enough evidence for a responsible recommendation.
- Be brief and concrete. No essays, no motivational language, no scores.`;


  const evidenceBlock = input.evidence
    .map(
      (e) =>
        `Evidence #${e.ref} | category: ${e.category} | direction: ${e.direction} | strength: ${e.strength}\nTitle: ${e.title}\nTakeaway: ${e.takeaway ?? "(none recorded)"}\nRaw note: ${e.raw_text.slice(0, 1200)}`,
    )
    .join("\n\n");

  const user = `Decision: ${input.decisionTitle}
Context from the PM: ${input.context?.trim() || "(none provided)"}
Computed verdict: ${VERDICT_LABEL[input.verdict]}
Computed confidence: ${input.confidence}
Evidence areas with no substantive evidence yet: ${input.uncoveredCategories.length ? input.uncoveredCategories.join(", ") : "none"}

Evidence on record (${input.evidence.length} item(s)):
${evidenceBlock || "(no evidence recorded)"}`;

  const data = await callModel(system, user);

  const claims = (value: unknown, allowedRefs: Set<number>) =>
    (Array.isArray(value) ? value : [])
      .map((raw) => {
        const obj = (raw ?? {}) as Record<string, unknown>;
        const claim = str(obj["claim"]);
        const refs = (Array.isArray(obj["evidence_refs"]) ? obj["evidence_refs"] : [])
          .map((r) => Number(r))
          .filter((r) => Number.isInteger(r) && allowedRefs.has(r));
        return claim && refs.length ? { claim, evidence_refs: refs } : null;
      })
      .filter((c): c is { claim: string; evidence_refs: number[] } => c !== null);

  const contradictRefs = new Set(
    input.evidence.filter((e) => e.direction === "CONTRADICTS").map((e) => e.ref),
  );
  const supportRefs = new Set(
    input.evidence.filter((e) => e.direction !== "CONTRADICTS").map((e) => e.ref),
  );

  const why = str(data["why"]);
  if (!why) throw new Error("Malformed AI response");

  const missing = (Array.isArray(data["missing"]) ? data["missing"] : [])
    .map((m) => str(m))
    .filter((m): m is string => m !== null)
    .slice(0, 3);

  return {
    why,
    supports: claims(data["supports"], supportRefs),
    contradicts: contradictRefs.size
      ? claims(data["contradicts"], contradictRefs)
      : [],
    unresolved: input.isConflict ? str(data["unresolved"]) : null,
    missing,
    next_action: str(data["next_action"]) ?? "",
    ai_generated: true,
  };
}

// ---------------------------------------------------------------------------

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { computeAssessment, evidenceFingerprint } from "@/lib/verdict";
import { fallbackBriefing } from "@/lib/briefing-fallback";

function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return `v1_${(h >>> 0).toString(36)}_${input.length}`;
}

/**
 * Loads a decision + its evidence, reuses a cached briefing when the evidence
 * set is unchanged, otherwise generates fresh evidence-grounded text.
 * The verdict itself is always recomputed here by deterministic rules.
 */
export async function loadAndBuildBriefing(
  supabase: SupabaseClient<Database>,
  decisionId: string,
): Promise<Briefing> {
  const [{ data: decision, error: dErr }, { data: rows, error: eErr }] =
    await Promise.all([
      supabase
        .from("decisions")
        .select("id, title, context")
        .eq("id", decisionId)
        .maybeSingle(),
      supabase
        .from("evidence_items")
        .select("*")
        .eq("decision_id", decisionId)
        .order("ref", { ascending: true }),
    ]);

  if (dErr) throw dErr;
  if (eErr) throw eErr;
  if (!decision) throw new Error("Decision not found");

  const items = (rows ?? []) as unknown as EvidenceItem[];
  const assessment = computeAssessment(items);

  if (items.length === 0) return fallbackBriefing(assessment, items);

  const fingerprint = hash(evidenceFingerprint(items));

  const { data: cached } = await supabase
    .from("decision_briefings")
    .select("payload")
    .eq("decision_id", decisionId)
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  if (cached?.payload) return cached.payload as unknown as Briefing;

  let briefing: Briefing;
  try {
    briefing = await generateBriefingText({
      decisionTitle: decision.title,
      context: decision.context,
      verdict: assessment.verdict,
      confidence: assessment.confidence,
      isConflict: assessment.isConflict,
      uncoveredCategories: assessment.uncoveredCategories,
      evidence: items,
    });
    if (!briefing.next_action) {
      briefing.next_action = fallbackBriefing(assessment, items).next_action;
    }
    if (briefing.supports.length === 0 && briefing.contradicts.length === 0) {
      const fb = fallbackBriefing(assessment, items);
      briefing.supports = fb.supports;
      briefing.contradicts = fb.contradicts;
    }
  } catch (err) {
    console.error("Briefing generation failed", err);
    return fallbackBriefing(assessment, items);
  }

  await supabase
    .from("decision_briefings")
    .upsert(
      { decision_id: decisionId, fingerprint, payload: briefing as never },
      { onConflict: "decision_id,fingerprint" },
    );

  return briefing;
}
