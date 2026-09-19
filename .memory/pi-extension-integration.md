---
name: pi-extension-integration
description: "Correction Guy's third platform target is Pi extensions; runtime + packaging gotchas"
metadata:
  node_type: memory
  type: project
  originSessionId: 39bc0537-f3c6-499a-8d90-ded0850ec1a1
---

Correction Guy ships for three hosts: Claude Code, Cursor, and Pi (pi.dev coding agent). Pi entrypoint is `scripts/pi-extension.ts` (a default-export factory), with `scripts/pi-adapter.ts` mapping Pi session entries ↔ the shared `core.ts`/`runHook` pipeline. Unlike the Claude/Cursor subprocess hooks, the Pi extension runs **in-process**: `turn_end` → live monitor (inject via `deliverAs:"steer"`), `agent_end` → stop check (block via `sendMessage` `followUp`+`triggerTurn` with a `blockCount` loop guard reset on user `input`/`session_start`), first `before_agent_start` → once-per-session prelude. User commands come from Pi's native skill loading, not from `registerCommand` (retired 2026-09-19): `package.json` `pi.skills` lists `./skills`, so Pi exposes `/skill:correctionguy`, `/skill:actually`, and `/skill:setup`, strips frontmatter itself, honors `disable-model-invocation`, and appends any arguments after the skill block (it does not substitute `$ARGUMENTS` inside a skill body; only prompt templates get that). For that reason `skills/actually/SKILL.md` carries no `$ARGUMENTS` placeholder: with no placeholder present, Claude Code appends `ARGUMENTS: <args>` to the body and Cursor appends the arguments after a blank line (source-traced on Claude Code 2.1.274 and Cursor CLI 2026.09.15), so all three hosts deliver the correction text the same way.

**Why:** Pi loads extensions under Node via jiti, not bun. So `scripts/codex.ts` MUST read `process.env`, never `Bun.env` (bun supports `process.env` too, so Claude/Cursor hooks keep working). And per Pi packaging docs, its bundled core packages go in `peerDependencies` with `"*"` — `@earendil-works/pi-coding-agent` is there (plus a `devDependencies` copy for local `tsc` and for `scripts/validate.ts`, which imports `loadSkillsFromDir` and `parseFrontmatter` at dev time); the extension's own import is type-only so Pi users get no runtime dep.

**How to apply:** Never revert `codex.ts` to `Bun.env` — it silently breaks Pi. Keep `@earendil-works/pi-coding-agent` out of `dependencies` (would double-bundle what Pi provides). The Pi "manifest" is the `pi` field in `package.json` (`extensions` and `skills`); Pi loads only what the manifest lists (no default `skills/` scan once a manifest exists), and `scripts/validate.ts` checks those paths exist. See [[memories-default-to-dot-memory]].
