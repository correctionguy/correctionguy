---
name: pi-extension-integration
description: The Pi extension runs in-process under Node via jiti; event mapping, packaging, and skill argument delivery
metadata:
  type: project
---

`scripts/pi-extension.ts` is a default-export factory, and `scripts/pi-adapter.ts` maps Pi session entries onto the shared `core.ts` and `runHook` pipeline. Events: the first `before_agent_start` injects the preamble once per session; `turn_end` runs the live monitor and delivers with `deliverAs: "steer"`; `agent_end` runs the stop check, sends a block as `followUp` with `triggerTurn` under a `blockCount` guard reset on user `input` and `session_start`, and sends a nudge as `nextTurn`. Pi never calls the `SessionStart` handler.

Pi loads extensions under Node via jiti, so every module the extension reaches uses `process.env`, never `Bun.*`. `@earendil-works/pi-coding-agent` sits in `peerDependencies` as `"*"` plus a `devDependencies` copy for `tsc` and `scripts/validate.ts`; the extension import is type-only. The Pi manifest is the `pi` field in `package.json`; Pi loads only what it lists and skips the default `skills/` scan once a manifest exists.

Pi appends skill arguments after the skill body and does not substitute `$ARGUMENTS`; Claude Code appends `ARGUMENTS: <args>` when no placeholder is present. `skills/actually/SKILL.md` therefore carries no `$ARGUMENTS` placeholder, so both hosts deliver the correction text the same way.

**How to apply:** Never revert `codex.ts` to `Bun.env`. Keep the Pi package out of `dependencies`. A new skill is a directory under `skills/` and nothing else; `pi.skills` already points there. See [[one-ondemand-surface-skill-not-command]].
