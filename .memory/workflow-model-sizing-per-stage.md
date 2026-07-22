---
name: workflow-model-sizing-per-stage
description: "Size Workflow agent() models per stage — sonnet scans, opus mid-weight, fable judgment; escalate fast when intelligence matters"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 3f619d58-0ad0-41dd-b30d-cebabd1f8687
---

User's Claim (2026-07-02): when authoring dynamic workflows (Workflow tool `agent()` calls), assess each stage's difficulty and set `model` per stage instead of letting everything inherit one tier. Ladder: Fable > Opus > Sonnet > Haiku. This guidance is embedded in the injected preamble (SESSION_START in `scripts/prompts.ts`) and mirrored in SKILL.md + command per [[release-process]].

**Why:** One-size-fits-all wastes either money (fable on greps) or quality (sonnet on judgment calls). The user explicitly wants rapid escalation when intelligence matters — being cheap on a hard verify/judge stage is the worse failure mode.

**How to apply:** explore/scan/grep/enumerate → `sonnet` or equivalent; drafting, root-causing a single item, mid-weight synthesis → `opus` or equivalent; adversarial verify, judge panels, final synthesis, subtle correctness reasoning → `fable` or equivalent. Escalate rapidly when performance is needed — don't hesitate on fable there; just don't use fable for every simple job. Per-stage routing is documented platform behavior: https://code.claude.com/docs/en/workflows ("Every agent in a workflow uses your session's model unless the script routes a stage to a different one"). Fable sits above Opus: https://www.anthropic.com/news/claude-fable-5-mythos-5
