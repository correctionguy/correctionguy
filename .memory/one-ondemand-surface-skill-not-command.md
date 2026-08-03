---
name: one-ondemand-surface-skill-not-command
description: On-demand Correction Guy reminder is skills/correctionguy/SKILL.md only; do not keep a same-named commands/correctionguy.md
metadata:
  type: feedback
---

The on-demand discipline reminder lives only at `skills/correctionguy/SKILL.md` (`/correctionguy`). Do not re-add `commands/correctionguy.md`.

**Why:** Owner (2026-08-01): having both a command and a skill for Correction Guy was very confusing. Claude Code and Cursor both register a same-named command and skill as one `/correctionguy` (skill wins on Claude Code), so the pair was duplicate surface plus sync burden. Skills are the current host format for this kind of reminder; `commands/cursor-setup.md` stays as the Cursor-only install walkthrough.

**How to apply:** When changing agent-facing discipline, sync `scripts/prompts.ts` (SESSION_START) with `skills/correctionguy/SKILL.md` only. Setup remains `skills/setup/SKILL.md` (`correctionguy:setup`). Convention overrides remain `skills/actually/SKILL.md` (`correctionguy:actually`; user-only). See [[release-process]], [[correctionguy-actually-overrides-rooted-conventions]].
