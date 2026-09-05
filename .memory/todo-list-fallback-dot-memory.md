---
name: todo-list-fallback-dot-memory
description: Host has no native todo tracker -> track the way the repo convention or instructions say; no dedicated TODO.md file
metadata:
  type: feedback
---

Owner rule (2026-09-05, replacing the 2026-07-23 rule): when the host session provides no native todo tracker (no TodoWrite/Task tools exposed, e.g. Cursor hooks), the agent tracks work the way the repo convention or instructions (AGENTS.md, `.memory`) say. The plugin no longer mandates a `.memory/TODO.md` file, and the reviewer prompts no longer read one.

**Why:** A plugin-imposed TODO file competed with whatever tracker the repo already uses (issue tracker, task list, instructions). The repo owns its tracking convention; the plugin only asks the agent to follow it. See [[memory-files-live-in-repo-dot-memory]].

**How to apply:** On every guidance surface (SESSION_START, STOP_PROMPT nudge, LIVE_MONITOR_PROMPT context note + flag #8, SKILL.md Track section): host gives no native tracker -> follow the repo tracking convention with the same discipline. Reviewer side: `todos` empty -> judge only by the tracking convention the repo instructions define; none defined -> skip the todo check. See [[live-monitor-todos-title-sources]] and [[reviewer-focus-assume-verify-drift]].
