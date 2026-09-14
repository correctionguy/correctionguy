---
name: codex-usage-limit-blocks-commits
description: A Codex usage-limit error in the pre-commit smoke test blocks every commit; the fix is a fresh login on the gate machine, never a bypass
metadata:
  type: project
---

The lefthook pre-commit gate runs `scripts/codex-smoke.test.ts`, a real Codex call. When the ChatGPT account behind `~/.codex/auth.json` has hit its usage limit, that test fails with "You've hit your usage limit ... try again at <date>" and every commit in this repo fails, including docs-only ones (observed 2026-09-14; the other four tests still pass, so the effort enum and the SDK version are not the cause).

**Why:** The smoke test is the sole guard against silent Codex SDK breakage, so the gate is never bypassed with `--no-verify` or `LEFTHOOK=0` (AGENTS.md). The SDK reads `~/.codex/auth.json` only, so a login on another machine or under a different `CODEX_HOME` does not count.

**How to apply:** Diagnose with `stat -c '%y' ~/.codex/auth.json` (a login that landed changes the mtime) and `node_modules/@openai/codex-linux-x64/vendor/*/bin/codex login status`. The owner logs a different account in on the gate machine (`codex login` or `codex login --device-auth`); the agent never rewrites that shared auth itself ([[no-unapproved-shared-config-mutation]]). Then rerun the commit. See [[codex-sdk-version-gates-new-models]].
