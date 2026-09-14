---
name: correctionguy-scope-generic-integrity-only
description: Correction Guy defines six generic integrity failures and keeps .memory as workspace truth; owner preferences and repo procedures (e.g. the "ship" definition) are instruction-file rules, never plugin definitions
metadata:
  type: feedback
---

Owner direction (2026-09-14): reduce what Correction Guy defines. The plugin owns the six generic failures any agent in any repo can commit ([[reviewer-six-failures]]) and the `.memory` feature as skills (setup, actually) and as workspace truth the reviewer checks against. Everything that describes how this owner likes to work or how a given repo ships is an instruction-file rule or the owner's global instructions, never a Correction Guy definition. The owner's named example: the "ship" definition ([[ship-vocabulary]]) is a repo rule; its generic form is the end gate (asked fix -> fixed, asked release -> released).

Wrong assumption that had rooted: every owner preference stated in a session got baked into all plugin surfaces (SESSION_START, stop check, live monitor, SKILL.md), so the plugin accreted ship vocabulary, workflow model sizing with host-specific model names, todo-tracking specifics, communication-style prescriptions, and memory layout mechanics.

**Why:** A stranger installing the plugin on an unrelated repo got rules that were not theirs, and the same rules already lived in the owner's global instructions, duplicated across layers ([[agents-md-holds-repo-specifics-only]]). The reviewer needs no copy of a rule: the missed-requirement flag enforces whatever the instruction files say.

**How to apply:** A rule goes into `scripts/prompts.ts` or `skills/correctionguy/SKILL.md` only as one of the six failures. Anything else belongs in the repo's instruction files or the owner's global instructions, and the reviewer reaches it only if that file is in the host's `instructionFiles` list and the host agent loads it, natively or by import: Claude Code loads `CLAUDE.md` and `.claude/rules/*.md`, not `AGENTS.md` (https://code.claude.com/docs/en/memory), which is why this repo carries a one-line `.claude/CLAUDE.md` importing `@../AGENTS.md` (a root `CLAUDE.md` fails `claude plugin validate --strict`). AGENTS.md stays on the Claude list because repos commonly import it from CLAUDE.md, as this one does. Related: [[workflow-model-sizing-per-stage]], [[todo-list-fallback-dot-memory]], [[no-info-bombing]], [[no-bs-talk]], [[user-agents-work-simultaneously]].
