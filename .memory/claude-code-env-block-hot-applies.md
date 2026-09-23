---
name: claude-code-env-block-hot-applies
description: Claude Code applies settings.json env additions to a running session but never unsets a removed key until restart
metadata:
  type: project
---

Claude Code re-reads the `env` block of its user settings while a session runs. New or changed keys reach hook subprocesses and Bash commands spawned afterwards. A removed key stays set until the session restarts.

**How to apply:** After editing `CORRECTIONGUY_*` values in the `env` block, verify the effective value in a fresh session, or pass the variables explicitly when running a hook script by hand. To confirm what a review ran with, read the newest Codex rollout file (`~/.codex/sessions/<y>/<m>/<d>/rollout-*.jsonl` with `originator: codex_sdk_ts`) and check `turn_context` for `model` and `effort`. See [[codex-sdk-version-gates-new-models]].
