---
name: codex-sdk-version-gates-new-models
description: OpenAI API 400-rejects models newer than the codex CLI the SDK vendors; failures are silent and only hit realistic payloads
metadata:
  type: project
---

`@openai/codex-sdk` pins a vendored codex CLI at the same version (dep `@openai/codex`, binary under `@openai/codex-darwin-arm64/vendor/.../bin/codex`). The OpenAI API rejects requests from CLIs older than the requested model: 400 `invalid_request_error` "The 'gpt-5.6-sol' model requires a newer version of Codex." (observed 2026-07-13; upgrade path https://github.com/openai/codex/releases, SDK https://www.npmjs.com/package/@openai/codex-sdk).

**Why:** correctionguy 3.6.0 shipped SDK 0.137.0; when the model moved to gpt-5.6-terra (07-10) then gpt-5.6-sol (07-12 via `CORRECTIONGUY_MODEL` in ~/.zshrc, which overrides the repo default), ~1,300 reviews failed silently over 3 days — hooks catch review errors, log to stderr, exit 0, so the plugin just "does nothing."

**How to apply:**

- Trivial codex calls PASS on an outdated CLI; only realistic-size review payloads trigger the 400. Never smoke-test with a hello-world call — `scripts/codex-smoke.test.ts` round-trips a real stop review (>50k chars) and runs on pre-commit via lefthook (red on 0.137.0, green on 0.144.x, verified 2026-07-13).
- Diagnose via `~/.codex/sessions/<y>/<m>/<d>/rollout-*.jsonl`: correctionguy runs have `originator: codex_sdk_ts`; broken ones end `task_complete` with `last_agent_message: null` in ~3-5s. The true error surfaces on stderr when running the hook manually with a real transcript.
- The Claude Code plugin cache (`~/.claude/plugins/cache/correctionguy/correctionguy/<ver>/`) has its own `node_modules`; a repo fix does not reach it until a [[release-process]] release + `claude plugin update correctionguy@correctionguy` (the bare name errors "not found"; the installer runs bun install for the new version dir). A manual `bun update` inside the current cache dir works as an immediate stopgap. Fixed in v3.6.1 (2026-07-13).
