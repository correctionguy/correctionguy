---
name: session-rename-not-programmatic
description: A Claude Code session NAME can't be set programmatically; only /rename or internal ai-title. A hook can set only the terminal TAB title via OSC.
metadata:
  type: reference
---

Verified 2026-06-26 against the Claude Code 2.1.193 binary and live tests in a real session. There are TWO distinct titles, which is the source of every contradiction in this area:

1. **Session name** — shown in the `/resume` picker and session list. In-memory it is `currentSessionTitle` (a custom title from `/rename`) `|| currentSessionAiTitle` (auto). UI refresh happens via `NYt.emit()`. **Not settable by any hook, tool, or file write.** `ai-title` is produced by an internal `generateSessionName` (a forked "kebab-case 2-4 words" model call) and persisted via `Hle(sessionId, title, source)`, which sets the in-memory field AND emits a redraw. It is guarded by `vh(kt())` — it SKIPS regeneration if the session already has a title (so the first auto-title sticks even after the task pivots). The JSONL is read for the title only at load/resume — `findLast` over roughly the last 64KB, and `customTitle` wins over `aiTitle`. Appending `ai-title`/`custom-title` records does NOT move the live title (in-memory cache is not refreshed). `~/.claude/sessions/<pid>.json` has NO `name` field in 2.1.193 and CC overwrites that file on every status tick, discarding unknown keys.

2. **Terminal tab/window title** — the emulator's tab. Set by writing an OSC sequence (`\033]0;TITLE\007`) to the TTY. CC writes it natively; disable CC's writer with `CLAUDE_CODE_DISABLE_TERMINAL_TITLE=1` (present in the binary). **A hook CAN set this** (it runs in CC's process and can write `/dev/tty`); the agent's own Bash tool CANNOT (no controlling TTY — confirmed: `/dev/tty` "device not configured"). You can also write to the CC process's controlling device directly, e.g. `ps -o tty= -p <pid>` then `printf '\033]0;…\007' > /dev/ttysNNN`. This is what `jkgeekJack/cc-session-title` does (OSC tab title); `dxrayhq/claude-session-labels` surfaces its label via a custom `statusLine` + the `custom-title` it writes for the picker — neither changes the session NAME.

Live tests this session: appending `{"type":"custom-title","customTitle":...,"sessionId":...}` → live title unchanged (picker-only on next load); writing `name` to `sessions/<pid>.json` → wiped within seconds; `/rename test` → works (in-memory path). The authentic `/rename` record in 2.1.193 IS `{"type":"custom-title","customTitle":"test","sessionId":...}` — identical to the injected format, so the format was never the problem; the in-memory cache is.

Consequence for this repo: the prompts carry NO title/`session_title`/`/rename` mention — never instruct the model to rename and never flag it for not renaming (it has no mechanism). The `session_title` plumbing was removed 2026-06-26 from `scripts/core.ts`, `correctionguy.ts`, `cursor-adapter.ts`, both hook entry points, and `pi-extension.ts` — the monitor no longer computes or sees any session title. For live per-tab visibility the only lever is an OSC terminal-title hook (sets the tab title, not the `/resume` name). See [[live-monitor-todos-title-sources]].

Sources: open feature requests https://github.com/anthropics/claude-code/issues/25045 , /29355 , /33165 ; https://github.com/jkgeekJack/cc-session-title ; https://github.com/dxrayhq/claude-session-labels ; CC 2.1.193 binary strings (`generateSessionName`, `currentSessionAiTitle`, `NYt.emit`, `CLAUDE_CODE_DISABLE_TERMINAL_TITLE`).
