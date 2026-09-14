---
name: claude-code-env-block-hot-applies
description: Claude Code applies settings.json `env` additions to the running session (hooks and Bash inherit them) without restart, but never unsets a removed key
metadata:
  type: project
---

Claude Code re-reads the `env` block of `~/.claude/settings.json` while a session runs. New or changed keys reach the process environment of subsequently spawned hook subprocesses and Bash tool commands. A key removed from the block stays set in the running session until restart. Verified 2026-09-07 with `CORRECTIONGUY_*` variables: an added `CORRECTIONGUY_MODEL_REASONING_EFFORT` kept its value in hook reviews after it was deleted from the file.

**Why:** `CORRECTIONGUY_*` variables in the user settings `env` block are how the Claude Code host adapter is configured; reasoning about which value a review actually used needs this.

**How to apply:** After editing `CORRECTIONGUY_*` values in the `env` block, verify the effective value in a fresh session, or pass the variables explicitly when running the hook scripts by hand. To confirm what a review ran with, read the newest `~/.codex/sessions/<y>/<m>/<d>/rollout-*.jsonl` with `originator: codex_sdk_ts` and check its `turn_context` payload (`model`, `effort`). See [[codex-sdk-version-gates-new-models]].
