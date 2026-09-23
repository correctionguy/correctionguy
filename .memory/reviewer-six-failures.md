---
name: reviewer-six-failures
description: The plugin defines six generic failures and nothing else; owner preferences and repo procedures are instruction-file rules the reviewer reaches through the per-host instructionFiles list
metadata:
  type: feedback
---

Every surface (`SESSION_START`, stop check, live monitor, `skills/correctionguy/SKILL.md`) flags six failures: unverified assumption, missed requirement (the ask to its end gate plus the instruction files the host loads), integration error, regression, wrong file, no reviews. User's Claims recorded in `.memory` count as checked. The reviewer's no-nitpick bar sits on top: extreme, integrity-harming violations only, "ok" when in doubt.

Retired and never re-added as flags or preamble lines: drift, wiping the user's work, todo drift, info-bombing, BS talk, ship vocabulary, workflow model sizing, `.memory` layout mechanics, write-side memory nudges, secret checks, and the agent-facing no-nitpick and ask-for-review lines. Each is an owner preference or repo procedure; the missed-requirement flag enforces it when an instruction file defines it, and nothing enforces it otherwise.

**Why:** A stranger installing the plugin on an unrelated repo must not receive one owner's rules, and the owner's rules already live in that owner's instruction files.

**How to apply:** A new flag must be one of the six or it does not go in. Never restore a deleted general-discipline rule to AGENTS.md or a prompt on the theory that the reviewer needs it. The reviewer reads instruction files only through the per-host `instructionFiles` string in `scripts/prompts.ts`: Claude names AGENTS.md, `.claude/AGENTS.md`, CLAUDE.md, `.claude/CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/`, `~/.claude/CLAUDE.md`, and `~/.claude/rules/` (https://code.claude.com/docs/en/memory); Pi names AGENTS.md, CLAUDE.md, `~/.pi/agent/AGENTS.md`, and `~/.pi/agent/CLAUDE.md` (the installed package's `dist/core/resource-loader.js`). A new location a host loads goes into that list, not into a flag. See [[reviewer-corrections-are-imperatives]], [[live-monitor-todos-title-sources]], [[claude-code-reads-agents-md]].
