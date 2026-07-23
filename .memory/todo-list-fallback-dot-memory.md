---
name: todo-list-fallback-dot-memory
description: Host has no native todo tracker -> the TODO list lives in .memory/TODO.md, kept current with the same discipline
metadata:
  type: feedback
---

Owner rule (2026-07-23): when the host session provides no native todo tracker (no TodoWrite/Task tools exposed, e.g. Cursor hooks), the TODO list lives in `.memory/TODO.md`.

**Why:** The tracked-list discipline must survive hosts that expose no todos channel. A file in the repo's `.memory` folder works on every host, and the reviewer prompts can read it to judge drift instead of skipping the check when `todos` comes in empty. See [[memory-files-live-in-repo-dot-memory]].

**How to apply:** Keep `.memory/TODO.md` current exactly like a native tracker: capture steps up front, mark starts and dones as they happen, add new asks as they arrive. The rule sits on every guidance surface (SESSION_START, STOP_PROMPT nudge, LIVE_MONITOR_PROMPT context note + flag #7, SKILL.md Track section, command item 2, AGENTS.md); the live monitor reads the file when `todos` is empty, and the stop check (no `todos` input) reads it when the transcript shows no native tracker in use. `.memory` is git-tracked, so the file holds public-safe content only. See [[live-monitor-todos-title-sources]].
