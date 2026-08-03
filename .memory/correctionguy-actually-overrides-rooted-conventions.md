---
name: correctionguy-actually-overrides-rooted-conventions
description: "/correctionguy:actually records that Correction Guy rooted on a wrong convention; write feedback memory and apply hereafter"
metadata:
  type: feedback
---

User-triggered surface (2026-08-03): `/correctionguy:actually` (skill at `skills/actually/SKILL.md`; Pi via `registerCommand("correctionguy:actually")`). Use when Correction Guy rooted on an old, outdated, or wrong convention. The agent must record the override in `.memory` as `type: feedback` (wrong assumption + correction; update conflicting memory in place), then apply it for the rest of the session and later ones. `disable-model-invocation: true` so only the user fires it.

**Why:** Informal "you're wrong" already belonged in `.memory`, but rooted conventions from past memories or guidance need a dedicated override path the user controls, so the reviewer stops enforcing the stale rule.

**How to apply:** Keep the procedure in `skills/actually/SKILL.md`. Agent-facing one-liner lives in SESSION_START + `skills/correctionguy/SKILL.md`. Reviewer stop nudge + live-monitor #8 treat an unrecorded actually-override as a durable-learning miss, and keep-enforcing-the-old-rule as breaking a memory fact. Do not add a `commands/actually.md`. See [[one-ondemand-surface-skill-not-command]], [[memories-default-to-dot-memory]], [[high-entropy-memory-mining]].
