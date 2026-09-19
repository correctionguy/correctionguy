---
name: correctionguy-actually-overrides-rooted-conventions
description: "/correctionguy:actually records that Correction Guy rooted on a wrong convention; write feedback memory and apply hereafter"
metadata:
  type: feedback
---

User-triggered surface (2026-08-03): `/correctionguy:actually` (skill at `skills/actually/SKILL.md`; on Pi it is `/skill:actually`, loaded natively through `package.json` `pi.skills` since 2026-09-19). Use when Correction Guy rooted on an old, outdated, or wrong convention. The agent must record the override in `.memory` as `type: feedback` (wrong assumption + correction; update conflicting memory in place), then apply it for the rest of the session and later ones. `disable-model-invocation: true` so only the user fires it.

**Why:** Informal "you're wrong" already belonged in `.memory`, but rooted conventions from past memories or guidance need a dedicated override path the user controls, so the reviewer stops enforcing the stale rule.

**How to apply:** Keep the procedure in `skills/actually/SKILL.md`. The `/correctionguy` skill's Start section points at it; SESSION_START no longer mentions it (2026-09-14). The reviewer treats keep-enforcing-the-old-rule as a missed requirement and no longer nudges about an unrecorded override ([[reviewer-six-failures]]). Do not add a `commands/actually.md`. See [[one-ondemand-surface-skill-not-command]], [[memories-default-to-dot-memory]], [[high-entropy-memory-mining]].
