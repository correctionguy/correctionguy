---
name: reviewer-six-failures
description: Correction Guy's whole scope is six named failures (unverified assumption, missed requirement, integration error, regression, wrong file, no reviews); everything else left the prompts
metadata:
  type: feedback
---

Owner rule (2026-09-14, replacing the 2026-09-05 three-hunt rule): the plugin flags six failures and nothing else, on every surface (SESSION_START, stop check, live monitor, `skills/correctionguy/SKILL.md`):

1. Unverified assumption: built on a guess about the system instead of checking in the workspace (repo code, installed package files, `.memory`, instruction files) or official docs. User's Claims recorded in `.memory` count as checked.
2. Missed requirement: behavior the instruction requires left out. Instruction = the user's ask to its end gate (asked fix -> fixed, asked release -> released, asked merge -> merged) plus the instruction files the host loads. Owner rules on model sizing, tracking, reporting, memory layout, or recording learnings are enforced here only when an instruction file defines them.
3. Integration error: right idea wired into the surrounding system wrong, including a broad catch that eats a real error.
4. Regression: existing behavior broken, including a failing test, build, typecheck, or lint left open.
5. Wrong file: change delivered where the running application never executes it.
6. No reviews: no programmatic verification (tests, smoke, build, output) and no empirical one (reviewer agent or review skill the instruction files define), a done claim with nothing behind it, or a review ignored.

Retired from the prompts the same day: drift as scope creep or going in circles, wiping the user's work, todo drift, info-bomb, BS talk, ship vocabulary, workflow model sizing, `.memory` layout mechanics, the write-side memory nudges (record the learning, public bar), and the agent-facing no-nitpick and ask-for-review lines. The reviewer's own no-nitpick bar stays on top ([[no-nitpick]]).

**Why:** The owner wants the plugin to define generic integrity failures only and to leave owner preferences and repo procedures to instruction files ([[correctionguy-scope-generic-integrity-only]]).

**How to apply:** A new flag must be one of the six or it does not go in. The reviewer reaches instruction-file rules only through the per-host `instructionFiles` list in `scripts/prompts.ts`: Claude names AGENTS.md, CLAUDE.md, `.claude/CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/`, `~/.claude/CLAUDE.md`, and `~/.claude/rules/` (https://code.claude.com/docs/en/memory); Cursor names AGENTS.md and `.cursor/rules`, and its User Rules are settings-only so the reviewer cannot read them (https://cursor.com/docs/context/rules); Pi names AGENTS.md, CLAUDE.md, `~/.pi/agent/AGENTS.md`, and `~/.pi/agent/CLAUDE.md` (README at https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md; the global candidates incl. CLAUDE.md are in the installed package's `dist/core/resource-loader.js`). The `todos` context field stays as evidence for a tracking rule ([[live-monitor-todos-title-sources]]).
