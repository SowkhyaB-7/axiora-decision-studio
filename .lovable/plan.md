# Axiora — Intelligence Rule Refinement

## Scope
Preserve the existing workspace, four modes, Decision Briefing, evidence flow, and visual design. Change only the goal interpretation behavior requested in the uploaded refinement.

## Changes
1. **Neutral timing**
   - Add an uncommitted status for work without supported timing.
   - Assign Now, Next, or Later only from explicit timing, stored timing context, or a genuine sequencing constraint.
   - Keep the existing urgency styling unchanged for committed states; neutral items receive no urgency claim.

2. **Minimum useful clarification**
   - Ask one question only when its answer materially changes the resulting structure or recommendation.
   - After an answer, prefer a useful initial path with visible uncertainty rather than another question, unless action remains impossible.

3. **Calibrated steps**
   - Generate conventional steps as proposed execution steps, never as facts about the user's process.
   - Do not invent approvals, stakeholders, tools, deadlines, or required deliverables.
   - Adjust existing task language so inferred steps are clearly framed as a reasonable approach without adding repeated disclaimers.

## Verification
Run the five supplied examples through the live AI flow and confirm:
- untimed deployment is neutral rather than Now;
- Friday timing can influence urgency;
- board preparation asks no more than the minimum useful clarification;
- documentation work is useful without invented requirements;
- the SSO question still opens the existing Decision Briefing.

Also verify the preview builds and the workspace still renders on desktop and mobile.
