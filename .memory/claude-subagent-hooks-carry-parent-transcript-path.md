---
name: claude-subagent-hooks-carry-parent-transcript-path
description: Inside a Claude Code subagent, hook input carries agent_id but transcript_path names the parent session file; the subagent log sits under <session-id>/subagents/; Stop never fires there
metadata:
  type: reference
---

Claude Code fires `PreToolUse`, `PostToolUse`, and `PostToolBatch` inside subagents with `agent_id` and `agent_type` set. `transcript_path` is built from the session id, so it names the parent session file, which holds no sidechain records. The subagent's own log is `<session-id>/subagents/agent-<agent_id>.jsonl` beside the parent file, or one level deeper under a spawn-specific directory (Workflow spawns land in `subagents/workflows/wf_<id>/`). A plugin `Stop` hook never fires inside a subagent; the end event is `SubagentStop`, which the plugin does not register, so `PostToolBatch` is the only reviewer channel there.

**Why:** Reading the parent log from a subagent reviews every sibling of a fan-out against the parent's context and fires them all on the parent's batch count.

**How to apply:** `scripts/correctionguy-hook.ts` searches `<dirname(transcript_path)>/<basename>/subagents/` recursively for `agent-<agent_id>.jsonl` when `agent_id` is present; a missing file throws and the entry point exits 0. Every correction is prefixed `[for <agent_id or session_id>]` as a forensic marker; a recipient does not know its own id, so the tag is never a discard key. See [[live-monitor-todos-title-sources]].
