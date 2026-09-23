---
name: claude-code-reads-agents-md
description: Claude Code v2.1.277 or later reads AGENTS.md as project instructions when no project CLAUDE.md exists; a .claude/CLAUDE.md counts as one and switches that off
metadata:
  type: reference
---

Claude Code reads every `AGENTS.md` and `.claude/AGENTS.md` in the working directory and above it at session start. The **Project instructions** setting (`pluginConfigs["agents-md@builtin"].options.instructionFiles`, honored in user or managed settings only) defaults to `claude-md-or-agents-md`: AGENTS.md loads only when no `CLAUDE.md`, `.claude/CLAUDE.md`, or `CLAUDE.local.md` exists in the working directory or above it. `~/.claude/CLAUDE.md`, the managed CLAUDE.md, and `.claude/rules/` load beside it either way. `AGENTS.local.md`, `AGENTS.override.md`, and `.agents/` are never read. Direct reading needs v2.1.277 or later, the built-in `agents-md` plugin enabled, and a session that fetched feature flags: not the first session after an install or upgrade, and not a Bedrock or telemetry-disabled session. Source: https://code.claude.com/docs/en/memory

**How to apply:** This repo keeps a root `AGENTS.md` and no CLAUDE.md anywhere. Never add a `.claude/CLAUDE.md` import shim: it counts as a project CLAUDE.md, and a root `CLAUDE.md` fails `claude plugin validate --strict`. See [[reviewer-six-failures]].
