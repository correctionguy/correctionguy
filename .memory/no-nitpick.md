---
name: no-nitpick
description: Reviews and monitors flag only extreme, severe, integrity-harming violations; cutting corners sometimes fine; reviewer bar since 3.9.0, agent-facing copy retired 2026-09-14
metadata:
  type: feedback
---

Never nitpick when reviewing or judging work (stop check, live monitor, session guidance, or my own replies). Point out only extreme and severe violations that would harm the integrity of the work. Cutting corners sometimes is fine: a small shortcut with the goal still delivered is not a flag, nudge, or block.

**Why:** The owner asked for this directly (2026-07-17): review noise on minor gaps erodes trust in the flags that matter; only integrity-harming failures deserve interruption.

**How to apply:** Lives on the reviewer prompts (stop check and live monitor in `scripts/prompts.ts`) as the bar over the six failures ([[reviewer-six-failures]]). The agent-facing copy left SESSION_START and `skills/correctionguy/SKILL.md` on 2026-09-14; the owner's global instructions hold that preference for my own reviews. When in doubt on severity, verdict is "ok".
