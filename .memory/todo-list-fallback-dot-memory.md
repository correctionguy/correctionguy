---
name: todo-list-fallback-dot-memory
description: Plugin no longer defines task tracking (2026-09-14); a tracking rule is a missed requirement only when an instruction file defines it; no dedicated TODO.md file
metadata:
  type: feedback
---

Owner rule (2026-09-05, replacing the 2026-07-23 rule): when the host session provides no native todo tracker (no TodoWrite/Task tools exposed, e.g. Cursor hooks), the agent tracks work the way the repo convention or instructions (AGENTS.md, `.memory`) say. The plugin no longer mandates a `.memory/TODO.md` file, and the reviewer prompts no longer read one.

**Why:** A plugin-imposed TODO file competed with whatever tracker the repo already uses (issue tracker, task list, instructions). The repo owns its tracking convention; the plugin only asks the agent to follow it. See [[memory-files-live-in-repo-dot-memory]].

**How to apply:** Retired from every plugin surface on 2026-09-14: no todo flag, nudge, or preamble line remains. Tracking is enforced only as a missed requirement when an instruction file defines a tracking rule, and the live monitor's `todos` context field stays as evidence for that judgment ([[reviewer-six-failures]]). See [[live-monitor-todos-title-sources]].
