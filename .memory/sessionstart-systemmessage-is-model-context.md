---
name: sessionstart-systemmessage-is-model-context
description: On Claude Code SessionStart, systemMessage lands in the transcript as context Claude sees, so text in both output fields is injected twice per fire; the preamble goes in additionalContext once and systemMessage is a one-line pointer
metadata:
  type: project
---

The Claude Code hook output field `systemMessage` is a message to the user. Most events discard it or deliver it elsewhere; on events that keep it, it shows in the transcript as a warning. SessionStart is an exception: Claude Code shows the system message in the transcript as context Claude can see and act on, and `hookSpecificOutput.additionalContext` is added to the session context for the next turn. Emitting the same text in both fields on SessionStart injects it twice on every fire, and SessionStart fires on `startup`, `resume`, `clear`, `compact`, and `fork`.

Consequence for the plugin: the SessionStart output carries `SESSION_START` in `additionalContext` only and sets `systemMessage` to a one-line pointer. The live-monitor correction keeps both fields: it is under 30 words and the user needs to see it. The Cursor and Pi adapters never read `systemMessage` on a context output, and Pi injects `SESSION_START` itself in `scripts/pi-extension.ts`, so this is Claude Code behavior only.

Source: https://code.claude.com/docs/en/hooks.md (JSON output table and the SessionStart section). See [[live-monitor-todos-title-sources]].
