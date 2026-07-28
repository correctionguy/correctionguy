---
name: cursor-plugin-hooks-never-execute
description: Cursor's agent runtime discovers and validates plugin-shipped hooks but has no code path that executes them; only 7 non-plugin hook sources run
metadata:
  type: reference
---

Read from the shipped Cursor agent CLI source (build 2026.07.23-e383d2b, bundles `index.js` + `3143.index.js`), 2026-07-28:

- The hook executor (`executeHookForStep`) collects hooks from exactly seven sources: enterprise, team, project (`.cursor/hooks.json`), user (`~/.cursor/hooks.json`), plus imported Claude settings hooks (`.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/settings.json`). No plugin source. The word "plugins" does not appear in the executor bundle at all.
- The plugin loader DOES discover, parse, validate, and transform plugin hooks: manifest `hooks` string path, inline object, or default `hooks/hooks.json`; both formats accepted (camelCase flat `{command}` "cursor" format and PascalCase nested "claude-code" format, auto-detected by first entry shape); `${CURSOR_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_ROOT}` are both substituted with the plugin root in `command`/`prompt` strings. Results feed the Settings/Plugins UI listing only.
- Net effect: plugin hooks appear in Cursor's Settings UI (discovery works) but never fire (executor ignores them). This is why Correction Guy's Cursor preamble, live monitor, and stop check never ran for Cursor users, from v1 through v3.11.0. The wiring was never executable, regardless of file format or env vars.
- `getCwdForSource` has a dead or forward-looking `"claude-plugin"` case (cwd = workspace path), suggesting plugin hook execution may arrive later. Re-verify on new Cursor releases before assuming this memory still holds.
- Hook env (`buildHookEnvironment`): `CURSOR_PROJECT_DIR`, `CURSOR_VERSION`, `CURSOR_USER_EMAIL` (if known), `CURSOR_TRANSCRIPT_PATH` (only when a transcript exists), `CLAUDE_PROJECT_DIR`, plus session env from `sessionStart` `env` output. No plugin-root env var for non-plugin hooks; user/project hooks.json therefore needs absolute command paths.
- Docs cross-check (2026-07-28): cursor.com/docs/hooks.md documents the base payload (incl. nullable `transcript_path`) on every event except `workspaceOpen`; `additional_context` honored on sessionStart/postToolUse, `followup_message` on stop, `loop_limit` per-script (default 5, null = uncapped); the `stop` payload has NO `last_assistant_message`. Claude-style `{decision:"block",reason}` on stop is treated as `followup_message` per cursor.com/docs/reference/third-party-hooks.md.

Live probe, agent CLI 2026-07-28 (all of the above confirmed against a real session):

- A probe plugin loaded via `--plugin-dir` fired ZERO hooks; project `.cursor/hooks.json` fired `sessionStart`, `postToolUse`, and `stop` in the same runs. User-level `~/.cursor/hooks.json` verified end to end: the model quoted the injected preamble verbatim.
- `sessionStart` arrives with `transcript_path: null` and no `CURSOR_TRANSCRIPT_PATH` env; both appear from the first `postToolUse` on. Any Cursor hook that requires a transcript up front dies on every event.
- `stop` fires in interactive sessions but NOT in headless `agent -p` runs. Payload carries `status`, `loop_count`, and token counts; no `last_assistant_message`.
- The transcript is role-keyed JSONL (`{"role":"user","message":{content:[...]}}` plus `{"type":"turn_ended"}` records), tool_use blocks have no id and there are no tool_result records; `core.ts` `TranscriptRecord` already normalizes `role` into `type`, so `parseTranscript` handles it unchanged. Do not "fix away" that role fallback.
- The hook env leaks a live `CURSOR_API_KEY` to hook subprocesses; never dump hook env unfiltered.

**Why:** Correction Guy shipped its Cursor hooks via `.cursor-plugin/plugin.json` `hooks` -> `hooks/cursor-hooks.json`, assuming plugin hooks execute. Users reported no hook ever fired; source reading found the executor gap and the live probe confirmed it.

**How to apply:** Deliver Cursor hooks through a source the executor actually runs, meaning project `.cursor/hooks.json` or user `~/.cursor/hooks.json` with absolute paths, not through the plugin manifest. Since v3.12.0 that is `scripts/cursor-install.ts` (idempotent merge into `~/.cursor/hooks.json`, plugin manifest no longer declares hooks, `/cursor-setup` command walks users through it). See [[live-monitor-todos-title-sources]] and [[cursor-marketplace-manual-review]].
