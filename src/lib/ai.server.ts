import type { Briefing } from "@/lib/briefing";
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
  "why": 2-4 sentences explaining the current state strictly from the evidence listed,
  "supports": [ { "claim": one short sentence, "evidence_refs": [evidence numbers] } ],
  "contradicts": [ { "claim": one short sentence, "evidence_refs": [evidence numbers] } ],
  "unresolved": one question capturing the open disagreement, or null if there is no disagreement,
  "missing": array of 1-3 specific things that still need to be confirmed,
  "next_action": one concrete next step for the PM
}

Rules:
- Every claim must cite at least one real evidence number from the list. Never cite a number that is not listed.
- "contradicts" must contain only evidence marked CONTRADICTS. Leave it empty if there is none.
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
