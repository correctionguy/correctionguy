---
name: cursor-setup
description: "Install Correction Guy's hooks into ~/.cursor/hooks.json; Cursor does not execute plugin-shipped hooks."
---

# Set up Correction Guy hooks for Cursor

Cursor lists plugin hooks in Settings but never executes them; hooks only run from `~/.cursor/hooks.json` or a project's `.cursor/hooks.json`. Do this now:

1. Ensure a stable checkout: if `~/.cursor/correctionguy` exists run `git -C ~/.cursor/correctionguy pull`, otherwise `git clone https://github.com/correctionguy/correctionguy ~/.cursor/correctionguy`.
2. Install dependencies: `cd ~/.cursor/correctionguy && bun install` (Bun is required; install it first if missing).
3. Install the hooks: `bun scripts/cursor-install.ts`. The installer idempotently merges Correction Guy's sessionStart, postToolUse, and stop entries into `~/.cursor/hooks.json` with absolute paths, preserving everything else in that file.
4. Confirm the installer printed the target path, then tell the user new Cursor agent sessions pick the hooks up automatically and that Codex must be authenticated once via `codex login` for the reviews to run.
