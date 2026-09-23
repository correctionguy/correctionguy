---
name: sessionstart-systemmessage-is-model-context
description: On Claude Code SessionStart, systemMessage lands in the transcript as model context, so the same text in both output fields is injected twice per fire
metadata:
  type: project
---

Claude Code treats a hook `systemMessage` as a message to the user, except on `SessionStart`, where it shows in the transcript as context the model sees and acts on. `hookSpecificOutput.additionalContext` also enters the context. `SessionStart` fires on startup, resume, clear, compact, and fork, so text in both fields lands twice per fire.

**How to apply:** The `SessionStart` output carries `SESSION_START` in `additionalContext` only and a one-line pointer in `systemMessage`. The live-monitor correction keeps both fields because it is short and the user needs to see it. Pi injects the preamble itself. Source: https://code.claude.com/docs/en/hooks.md. See [[live-monitor-todos-title-sources]].
