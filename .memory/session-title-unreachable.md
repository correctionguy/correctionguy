---
name: session-title-unreachable
description: A hook cannot set the Claude Code session title; the title reaches nothing and the prompts never mention it
metadata:
  type: reference
---

A hook cannot set the session name. `session_title` appears only on `SessionStart` input. The name lives in memory and changes only through `/rename` or the internal auto-title. `/rename` writes a `custom-title` record, but appending the same record from outside does not move the live title, because the JSONL is read for the title only at load or resume. A hook can set only the terminal tab title, by writing an OSC sequence to the TTY. The agent's Bash tool has no TTY and cannot.

**How to apply:** The prompts carry no title, `session_title`, or `/rename` mention; never instruct the model to rename or flag it for not renaming. Sources: https://code.claude.com/docs/en/hooks.md, https://code.claude.com/docs/en/commands
