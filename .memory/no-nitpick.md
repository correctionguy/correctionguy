---
name: no-nitpick
description: Reviews and monitors flag only extreme, severe, integrity-harming violations; cutting corners sometimes fine; on all guidance surfaces since 3.9.0
metadata:
  type: feedback
---

Never nitpick when reviewing or judging work (stop check, live monitor, session guidance, or my own replies). Point out only extreme and severe violations that would harm the integrity of the work. Cutting corners sometimes is fine: a small shortcut with the goal still delivered is not a flag, nudge, or block.

**Why:** The owner asked for this directly (2026-07-17): review noise on minor gaps erodes trust in the flags that matter; only integrity-harming failures deserve interruption.

**How to apply:** Lives on all guidance surfaces (like [[no-info-bombing]]): SESSION_START + STOP_PROMPT + LIVE_MONITOR_PROMPT in `scripts/prompts.ts`, `skills/correctionguy/SKILL.md`. When in doubt on severity, verdict is "ok". Existing plumbing nudges (memory, todos, info-bomb, BS talk) stay but are secondary; the main hunt is [[reviewer-focus-assume-verify-drift]] (assumed instead of checked, claimed done with no verification, drift off the user ask).
