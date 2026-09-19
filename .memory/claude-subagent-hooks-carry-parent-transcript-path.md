---
name: claude-subagent-hooks-carry-parent-transcript-path
description: Inside a Claude Code subagent, hook input carries agent_id but transcript_path still names the parent session file; the subagent's own log is <session-id>/subagents/**/agent-<agent_id>.jsonl; Stop never fires there (SubagentStop does, unregistered)
metadata:
  type: reference
---

Claude Code runs plugin hooks inside subagents: when a subagent calls a tool, `PreToolUse`, `PostToolUse`, and `PostToolBatch` fire the same configured hooks as the main thread, and the input carries `agent_id` and `agent_type` (https://code.claude.com/docs/en/hooks). Two facts the docs leave out, read from the Claude Code 2.1.270 build and confirmed on disk:

- `transcript_path` in that input is built from the session id, so inside a subagent it names the parent session's `<session-id>.jsonl`, never the subagent's log. The parent file holds no sidechain records.
- The subagent's own log is `~/.claude/projects/<slug>/<session-id>/subagents/agent-<agent_id>.jsonl`, or one level deeper under a spawn-specific subdirectory (Workflow spawns land in `subagents/workflows/wf_<id>/`). Claude Code hands that path out as `agent_transcript_path` on `SubagentStop` only. A plugin `Stop` hook never fires inside a subagent; the subagent end event is `SubagentStop`, which the plugin does not register, so the only reviewer channel inside a subagent is `PostToolBatch`.

Wrong assumption that had rooted (through v3.20.0): the Claude entry point read `transcript_path` as the transcript of whatever produced the tool batch. In a fan-out of 6 to 20 subagents, every sibling's live monitor read the parent's last 60 lines, the parent's todos, and the parent's batch count, so all siblings were reviewed on the same tick against the parent's context and received corrections about work only the parent or one sibling had done (issue 12: eight siblings told to scrub a key only the parent had mentioned, four told not to merge a PR only the parent had merged).

**Why:** The reviewer's context must come from the agent it steers. Reading the parent's log from inside a subagent is the wrong file, and the batch-count cadence computed from it fires for every sibling at once.

**How to apply:** The Claude entry point `scripts/correctionguy-hook.ts` resolves the subagent file when `agent_id` is present: `<dirname(transcript_path)>/<basename(transcript_path, .jsonl)>/subagents/` searched recursively for `agent-<agent_id>.jsonl`; a missing file throws, and the hook entry logs it and exits 0. Since v3.23.0 every correction is prefixed `[for <agent_id or session_id>]` so a transcript shows which agent a message targeted. A recipient does not know its own id, so the tag is a forensic marker, not a discard key. Related: [[live-monitor-todos-title-sources]], [[codex-read-only-sandbox-reads-whole-fs]].
