# Axiora — Intelligence Layer + Workspace Evolution

## What exists today (checked before planning)

Axiora today is decision-only:

- Home lists launch decisions with a verdict badge and confidence chip.
- New Decision is a framing form (title, context, decide-by).
- Decision Briefing shows the deterministic verdict, the tension, supporting/contradicting claims with citation chips, missing evidence, next action, overrides with a reason, and outcome capture.
- Evidence Quick-Add takes pasted text or a PDF/DOCX/TXT document, runs real AI extraction, and asks you to confirm before saving.

One important mismatch with the brief: there is **no organic polygon/cluster workspace and no central input** in the current app. Section 12 asks me to preserve them, but they were never built. So this iteration adds them for the first time, in the existing calm editorial visual language (same colours, Instrument Serif headings, same spacing and card language) — not a redesign.

## What this iteration builds

### 1. Central input becomes Home

Home becomes the workspace: one prominent "What are you trying to accomplish?" input at the centre, with the work that already exists arranged around it. Existing decisions keep working and appear in the workspace.

### 2. One classifier, four responses

Submitting a goal calls a single AI step that returns an intent and the right structure. No mode picker.

- **Simple** — 3-5 short steps plus one next action. Nothing more.
- **Ambiguous** — one high-value clarifying question with a few suggested answers; after answering, it structures the work.
- **Dependency** — the work plus a *possible* blocker, phrased as a suggestion ("Axiora thinks this may be blocked by …") with Confirm / Not a blocker.
- **Decision** — creates a real decision and opens the existing Briefing surface untouched, so evidence, conflict, and citations all keep working.

### 3. Organic workspace

Work items cluster by workstream (emerging from the work itself, not fixed departments) and are sized by urgency: Now is largest, Next moderate, Later quiet, Completed receded, Blocked visually marked with its blocker link. No kanban, table, Gantt, or calendar.

### 4. Correction is always one click away

Every classified item can be re-pointed ("Actually this is a decision", "Not a blocker") from the item itself. Corrections are stored, and a decision correction hands the item to the existing decision flow.

### 5. Trust labelling

Anything the AI inferred is labelled as inference or possible, never as fact. Uncertainty stays visible; the decision surface keeps its existing calibrated language.

## Technical notes

- New table `work_items`: title, description, workstream, status (NOW/NEXT/LATER/BLOCKED/COMPLETED), mode, steps, next_action, blocked_by (self-FK), clarifying question + answer, ai_reasoning, user_corrections, optional `decision_id` link. RLS per owner plus grants.
- New server function `interpretGoal` in `src/lib/ai.functions.ts` backed by `src/lib/ai.server.ts`, reusing the existing gateway call, JSON guardrails, and enum-picking helpers. Same model, same no-invented-facts rules.
- Decision mode inserts into the existing `decisions` table, so `src/lib/verdict.ts`, the briefing cache, and Quick-Add are reused as-is, not duplicated.
- New components: workspace canvas, work-item node, interpretation result card, correction control. Existing `AppShell`, `AppSidebar`, `VerdictBadge`, and the briefing route stay in place.
- Old V1 tables (`decision_boards`, `assessment_dimensions`, `evidence`, `ai_analyses`, `final_decisions`) are left alone; nothing reads them.

## Not building

Gantt, resourcing, comments, chat inbox, generic assistant, CRM, analytics dashboards, integrations, settings screens, extra workspace views.
