---
name: live-monitor-todos-title-sources
description: Todos reach the live monitor through hook tool_input/tool_response plus transcript reconstruction; the session title reaches nothing and the prompts never mention it
metadata:
  type: reference
---

- Todos are a hook API. Claude Code `PostToolUse` and `PostToolBatch` input carries `tool_input` and `tool_response` per call: `TodoWrite.tool_input.todos` is the full list, `TaskCreate` and `TaskUpdate` inputs are deltas by `taskId`, and the created id comes back in the `tool_result`. The plugin passes the batch as `current_tool_batch`, and `currentTodos` in `scripts/core.ts` rebuilds the resolved list from the transcript (real ids from the `Task #N created successfully:` result, `TaskUpdate` replayed by id, latest `TodoWrite` snapshot as fallback). Hosts without Task tools yield an empty list. `todos` is evidence for a tracking rule an instruction file defines, nothing more.
- A hook cannot set the session name. `session_title` appears only on `SessionStart` input. The name lives in memory and changes only through `/rename` or the internal auto-title. `/rename` writes a `custom-title` record, but appending the same record from outside does not move the live title, because the JSONL is read for the title only at load or resume. A hook can set only the terminal tab title, by writing an OSC sequence to the TTY. The agent's Bash tool has no TTY and cannot.

**How to apply:** The prompts carry no title, `session_title`, or `/rename` mention; never instruct the model to rename or flag it for not renaming. Sources: https://code.claude.com/docs/en/hooks.md, https://code.claude.com/docs/en/agent-sdk/todo-tracking.md, https://code.claude.com/docs/en/commands
