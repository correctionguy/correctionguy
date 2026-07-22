---
name: memory-files-live-in-repo-dot-memory
description: Real agent-memory files live in the repo's .memory folder; the traditional ~/.claude memory dir is a symlink into it (not the reverse)
metadata:
  type: feedback
---

The real agent-memory files must physically live in the project's `.memory` folder, and the agent's traditional memory directory (`~/.claude/projects/<slug>/memory`) must be a symlink pointing into `.memory` — not the other way around.

**Why:** The user wants memories to live with the repo. I first set it up backwards (made `.memory` a symlink to the real `~/.claude` dir) and was corrected.

**How to apply:** If the real files sit in the traditional `~/.claude` location (or a folder rename left them elsewhere), move them into the repo's `.memory` and replace the old location with a symlink to `.memory`. Read/write through the normal memory path; it resolves into the repo. See [[codex-read-only-sandbox-reads-whole-fs]].

`.memory` must NOT be git-tracked — including `MEMORY.md`. It is listed in `.gitignore`; memories live with the repo on disk but stay out of version control. The user corrected this directly (2026-06-26): "MEMORY should not be tracked." Do not `git add` anything under `.memory`, and if a file there is ever tracked, `git rm --cached` it.
