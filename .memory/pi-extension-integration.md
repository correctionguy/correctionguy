---
name: pi-extension-integration
description: "Correction Guy's third platform target is Pi extensions; runtime + packaging gotchas"
metadata:
  node_type: memory
  type: project
  originSessionId: 39bc0537-f3c6-499a-8d90-ded0850ec1a1
---

Correction Guy ships for three hosts: Claude Code, Cursor, and Pi (pi.dev coding agent). Pi entrypoint is `scripts/pi-extension.ts` (a default-export factory), with `scripts/pi-adapter.ts` mapping Pi session entries ↔ the shared `core.ts`/`runHook` pipeline. Unlike the Claude/Cursor subprocess hooks, the Pi extension runs **in-process**: `turn_end` → live monitor (inject via `deliverAs:"steer"`), `agent_end` → stop check (block via `sendMessage` `followUp`+`triggerTurn` with a `blockCount` loop guard reset on user `input`/`session_start`), first `before_agent_start` → once-per-session prelude.

**Why:** Pi loads extensions under Node via jiti, not bun. So `scripts/codex.ts` MUST read `process.env`, never `Bun.env` (bun supports `process.env` too, so Claude/Cursor hooks keep working). And per Pi packaging docs, its bundled core packages go in `peerDependencies` with `"*"` — `@earendil-works/pi-coding-agent` is there (plus a `devDependencies` copy for local `tsc`); the import is type-only so there is no runtime dep.

**How to apply:** Never revert `codex.ts` to `Bun.env` — it silently breaks Pi. Keep `@earendil-works/pi-coding-agent` out of `dependencies` (would double-bundle what Pi provides). The Pi "manifest" is the `pi.extensions` field in `package.json`; `scripts/validate.ts` checks those paths exist. See [[memories-default-to-dot-memory]].
