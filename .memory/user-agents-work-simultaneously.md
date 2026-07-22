---
name: user-agents-work-simultaneously
description: User and agents share the checkout live; never git reset or remove user's work — collision means stop and ask
metadata:
  type: feedback
---

The user and agents work on the same checkout simultaneously (owner's statement, 2026-07-08). Never `git reset`, `checkout`/`restore` over, `clean`, stash-drop, or otherwise remove or overwrite the user's work. If work genuinely collides, stop and politely ask the user.

**Why:** Parallel edits from the user can appear in the working tree at any moment; destructive git operations silently destroy them.

**How to apply:** Baked into every guidance surface on 2026-07-08: `scripts/prompts.ts` (SESSION_START preamble, STOP_PROMPT block list, LIVE_MONITOR_PROMPT flag #10), `skills/correctionguy/SKILL.md` ("Never wipe user's work"), `commands/correctionguy.md` (item 6 "Preserve"), and AGENTS.md User's Claim. Keep these in lockstep when editing, per [[release-process]]. Recorded as a User's Claim per [[memories-default-to-dot-memory]].
