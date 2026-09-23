---
name: codex-usage-limit-blocks-commits
description: A Codex usage-limit error in the pre-commit smoke test blocks every commit; the fix is a fresh login on the gate machine, never a bypass
metadata:
  type: project
---

The pre-commit gate runs `scripts/codex-smoke.test.ts`, a real Codex call. When the account behind `~/.codex/auth.json` is over its usage limit, the test fails with "You've hit your usage limit" and every commit fails, including docs-only ones; the other tests still pass, so the effort enum and the SDK version are not the cause. The SDK reads `~/.codex/auth.json` only, so a login on another machine or under a different `CODEX_HOME` does not count.

**How to apply:** Diagnose with `stat -c '%y' ~/.codex/auth.json` and `node_modules/@openai/codex-linux-x64/vendor/*/bin/codex login status`. The owner logs a different account in on the gate machine (`codex login` or `codex login --device-auth`); the agent never rewrites that shared auth. Then rerun the commit. Never bypass the gate. See [[codex-sdk-version-gates-new-models]].
