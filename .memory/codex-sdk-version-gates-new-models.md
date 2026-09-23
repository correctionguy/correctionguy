---
name: codex-sdk-version-gates-new-models
description: The OpenAI API 400-rejects a model newer than the codex CLI the SDK vendors; the failure is silent and only realistic payloads surface it
metadata:
  type: project
---

`@openai/codex-sdk` vendors a codex CLI at the same version. The API rejects requests from a CLI older than the requested model with a 400 "requires a newer version of Codex". Hooks catch review errors, log to stderr, and exit 0, so the plugin looks like it does nothing. Trivial calls pass on an outdated CLI; only realistic-size review payloads trigger the 400.

**How to apply:**

- Never smoke-test with a hello-world call. `scripts/codex-smoke.test.ts` round-trips a real stop review of over 50k characters and runs on pre-commit.
- Diagnose from the Codex rollout files (`~/.codex/sessions/<y>/<m>/<d>/rollout-*.jsonl` with `originator: codex_sdk_ts`): a broken run ends `task_complete` with `last_agent_message: null` within seconds. Running the hook by hand with a real transcript prints the error on stderr.
- The Claude Code plugin cache (`~/.claude/plugins/cache/correctionguy/correctionguy/<ver>/`) has its own `node_modules`. A repo fix reaches it only through a release plus `claude plugin update correctionguy@correctionguy`. The stopgap is `bun add @openai/codex-sdk@<version> --ignore-scripts` inside the cache directory; the repo needs the same exact pin. See [[release-process]], [[codex-effort-levels-and-speed-tiers]], [[claude-code-env-block-hot-applies]].
