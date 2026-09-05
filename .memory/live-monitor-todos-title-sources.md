---
name: live-monitor-todos-title-sources
description: Where the live monitor gets todos + session title per host; what is a real hook API vs transcript-only
metadata:
  type: reference
---

How Correction Guy's live monitor obtains the current to-do list and session title (researched 2026-06-25, verified against official docs):

- **Todos — there IS a direct hook API.** Claude Code's PostToolUse/PostToolBatch hook input carries `tool_input` AND `tool_response` for each tool call. So `TodoWrite.tool_input.todos` is the full list each call, and `TaskList.tool_output.tasks` returns the full current list; `TaskCreate`/`TaskUpdate` inputs are deltas (`taskId`, `status`...). The plugin ALREADY receives these as `tool_calls` and passes them to the monitor as `current_tool_batch` (with both input and response). The transcript reconstruction in `currentTodos` additionally yields the resolved full list at any hook fire (the current batch may not touch todos). Modern default is Task tools; no `~/.claude/todos/` file exists. (Earlier "transcript-only" framing was wrong — todos are an API channel.)
- **Title — `session_title` field exists, but only on SessionStart.** Claude Code's SessionStart input includes `session_title` (the current name from `--name`/`/rename`); a SessionStart hook can emit `sessionTitle`. It is NOT in PostToolBatch/Stop inputs, so the live monitor and stop check cannot read it directly. `/rename` is a built-in command (not a tool) and does not write an `ai-title` transcript record, so an explicit rename is invisible to the monitor. At PostToolBatch time the only available title source is the latest `{"type":"ai-title","aiTitle":...}` transcript record (auto-generated).
- **Cursor:** exposes neither todos nor chat title to hooks — not in any payload, not in the transcript. They degrade to empty. Since 2026-09-05, hosts with no native tracker follow the repo's own tracking convention; when `todos` is empty the reviewers judge only by the convention the repo instructions define, and skip the check when none is defined. See [[todo-list-fallback-dot-memory]].
- Implemented in `scripts/core.ts`: `currentTodos` reconstructs the list in one pass — it reads each task's real id and subject straight from the `Task #N created successfully:` tool_result (NOT synthetic creation-order counting), replays `TaskUpdate` status changes by that id, and falls back to the latest `TodoWrite` snapshot. `currentTodos` stays a single function because inlining it trips eslint complexity (>20); the AGENTS helper-ban note allows a function as the last resort for exactly that. (All session-title handling the plugin once had — reading `ai-title`, the persisted SessionStart `session_title`, `explicitTitle || aiTitle` — was REMOVED 2026-06-26; the monitor no longer touches any title. See [[session-rename-not-programmatic]].) See [[memory-files-live-in-repo-dot-memory]].

Sources (verified):

- Hook inputs (`session_title` only on SessionStart; PostToolUse carries `tool_input`/`tool_response`): https://code.claude.com/docs/en/hooks.md
- Todos as a tool channel (TodoWrite `tool_input.todos` is the full list; Task tools `TaskCreate`/`TaskUpdate` by `taskId`, `TaskList` tool result is a snapshot; id comes back in the `tool_result` as `{ task: { id, subject } }`; read keys defensively): https://code.claude.com/docs/en/agent-sdk/todo-tracking.md
- `/rename` is a built-in command, not a tool: https://code.claude.com/docs/en/commands
