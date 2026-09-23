---
name: one-ondemand-surface-skill-not-command
description: Skills are the only on-demand surfaces; never add a commands/ directory, since a same-named command and skill collapse into one slash command
metadata:
  type: feedback
---

`/correctionguy` is `skills/correctionguy/SKILL.md`, `/correctionguy:setup` is `skills/setup/SKILL.md`, and `/correctionguy:actually` is `skills/actually/SKILL.md` (user-only through `disable-model-invocation`). Claude Code registers a same-named command and skill as one slash command, so a `commands/` copy is duplicate surface plus sync burden. Pi loads the same skills through `package.json` `pi.skills` as `/skill:<name>`.

**How to apply:** Do not add `commands/correctionguy.md` or `commands/actually.md`. When agent-facing discipline changes, sync `SESSION_START` in `scripts/prompts.ts` with `skills/correctionguy/SKILL.md` only. The actually skill records an override in `.memory` as `type: feedback` and updates the conflicting memory in place; `SESSION_START` does not mention it. See [[pi-extension-integration]].
