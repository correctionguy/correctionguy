---
name: cursor-plugin-hooks-never-execute
description: Cursor executes plugin-shipped command hooks since its 2026-08-11 CLI release (source-traced on build 2026.09.15); the July 2026 finding below that only 7 non-plugin sources run is superseded
metadata:
  type: reference
---

Correction, 2026-09-19 (later correction wins): Cursor's CLI changelog for 2026-08-11 states "Plugin hooks run from installed plugins. Hooks defined by installed plugins, including those loaded with `--plugin-dir`, now execute and refresh when plugins reload." A source trace of build 2026.09.15-d2fe57e (`190.index.js`, hooks executor) confirms it: after the eight non-plugin sources, `executeHookForStep` appends every `config.pluginHooks` entry with `source: "claude-plugin"`, `cwd` = plugin install path (workspace path for `stop`), env `CURSOR_PLUGIN_ROOT` and `CLAUDE_PLUGIN_ROOT` = install path, and the entries reach the same shell executor. `pluginHooks` is populated at startup from `getPluginHooks()` over all enabled plugins (manifest `hooks` path or default `hooks/hooks.json`) and refreshed on plugin reload; no feature gate. Only command hooks are appended; plugin prompt hooks are dropped. Not yet live-probed (no installed plugin on the gate machine ships hooks); the probe and the migration off `scripts/cursor-install.ts` are issue #19. Everything below describes build 2026.07.23 and stays as history of why the installer exists.

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

**How to apply:** Until issue #19 lands, delivery stays `scripts/cursor-install.ts` (idempotent merge into `~/.cursor/hooks.json`, plugin manifest declares no hooks, `/cursor-setup` command walks users through it). Once the live probe confirms plugin hooks fire on a current build, point `.cursor-plugin/plugin.json` `hooks` at `hooks/cursor-hooks.json` (both hosts default to `hooks/hooks.json`, which is the Claude format) and retire the installer, the command, and the README clone steps. See [[live-monitor-todos-title-sources]] and [[cursor-marketplace-manual-review]].
