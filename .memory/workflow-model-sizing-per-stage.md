---
name: workflow-model-sizing-per-stage
description: "Fill model on every subagent/workflow spawn, never inherit; mix ~16 fast : 4 balance : 1 smart"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 3f619d58-0ad0-41dd-b30d-cebabd1f8687
---

User's Claim (2026-07-02, expanded 2026-08-30): every subagent or workflow spawn (Task, Workflow tool `agent()` calls, or equivalent) must fill `model`. Never omit it, never inherit the parent session default. Typical spawn mix about 16 fast : 4 balance : 1 smart, not a hard quota: many cheap scouts, fewer mid-weight, rare smart. Claude Code example: 16 sonnet, 4 opus, 1 fable. This guidance is embedded in the injected preamble (SESSION_START in `scripts/prompts.ts`) and mirrored in SKILL.md per [[release-process]].

**Why:** One-size-fits-all wastes either money (smart on greps) or quality (fast on judgment calls). Omitting `model` silently inherits the session default, so a fable/opus parent session makes every scout expensive. The user wants a lopsided mix and rapid escalation when intelligence matters. Being cheap on a hard verify/judge stage is the worse failure mode.

**How to apply:** explore/scan/grep/enumerate → fast (`sonnet` or equivalent); drafting, root-causing a single item, mid-weight synthesis → balance (`opus` or equivalent); adversarial verify, judge panels, final synthesis, subtle correctness reasoning → smart (`fable` or equivalent). Escalate rapidly when performance is needed. Don't hesitate on smart there; just don't use smart for every simple job. Per-stage routing is documented platform behavior: https://code.claude.com/docs/en/workflows ("Every agent in a workflow uses your session's model unless the script routes a stage to a different one"). Fable sits above Opus: https://www.anthropic.com/news/claude-fable-5-mythos-5
