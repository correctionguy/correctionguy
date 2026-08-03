# AGENTS.md

Repo-specific notes only. General working discipline is not repeated here. Background facts live in `.memory/`, indexed by `.memory/MEMORY.md`; load one when its topic comes up.

correctionguy ships one plugin for three hosts: Claude Code, Cursor, and Pi (pi.dev). The Claude and Cursor hooks run as subprocesses; the Pi extension runs in-process. Cursor exposes neither todos nor chat title to hooks, so both degrade to empty. Cursor never executes plugin-shipped hooks: delivery there is `scripts/cursor-install.ts`, which merges `hooks/cursor-hooks.json` (with `${CURSOR_PLUGIN_ROOT}` replaced by the checkout path) into `~/.cursor/hooks.json`. See `.memory/cursor-plugin-hooks-never-execute.md`.

# Traps

- Local dev is Bun, but shipped code must run under Node: Pi loads extensions via jiti, not bun. Bun-only APIs (`Bun.env`, `Bun.file`) stay out of `scripts/` entirely. `scripts/codex.ts` must read `process.env`; reverting it to `Bun.env` silently breaks the Pi host while Claude and Cursor keep working.
- `@earendil-works/pi-coding-agent` is managed by hand, never via `bun add`: a `peerDependencies` entry of `"*"` plus a `devDependencies` copy for local `tsc`. Keep it out of `dependencies`, which would double-bundle what Pi already provides. The Pi manifest is the `pi.extensions` field in `package.json`, and `scripts/validate.ts` checks those paths exist.
- Hook entry points are the one sanctioned catch boundary: they log to stderr and exit 0 so a plugin failure never breaks the host session. Everywhere else, fail fast and visibly.
- Every `CORRECTIONGUY_*` env var is optional. The plugin must never crash at load over env; a missing var degrades its own feature at the use site. Cursor launches hooks with a constructed environment, not the user's shell env, so `CORRECTIONGUY_*` shell exports never reach the Cursor hooks (live-verified 2026-07-29); defaults apply there.
- A repo fix does not reach Claude Code users until a release plus a plugin update: the plugin cache (`~/.claude/plugins/cache/correctionguy/correctionguy/<ver>/`) carries its own `node_modules`.
- Cursor's `sessionStart` payload arrives with `transcript_path: null`, and `stop` never fires in headless `agent -p` runs. The Cursor entry point must keep working without a transcript: the preamble needs none, and the reviews skip quietly when it is absent.
- Cursor's `additional_context` lands in stored history the running generation never reads, so live-monitor corrections deliver on two channels: `postToolUse` still emits `additional_context` (guaranteed next-generation delivery, and the only channel on installs whose `~/.cursor/hooks.json` predates `preToolUse`) and also writes a pending-correction file (tmpdir, keyed by conversation, guarded by generation), which the `preToolUse` hook consumes to hold the next tool call and feed the correction back mid-generation via `agent_message`. Stale-generation pending files are consumed and dropped since the context channel already delivered them. Never make the pending file the only delivery path. `generation_id` on pre/postToolUse is per-turn (live-probed 2026-07-29); a bundle-reading pass that concludes it equals the conversation id has mis-traced the minified code. See `.memory/cursor-hook-messages-queue-not-steer.md`.
- Never smoke-test Codex with a trivial call. Trivial calls pass on an SDK whose vendored CLI is too old for the requested model; only realistic-size payloads surface the 400, and hooks swallow the error and exit 0, so breakage looks like the plugin doing nothing. See `.memory/codex-sdk-version-gates-new-models.md`.

# Local rules that override the global ones

- Never add comments. If you see one, delete it.
- Never add helper functions to deduplicate, including inline closures created only to dedupe; use es-toolkit or duplicate the few lines. When cyclomatic complexity trips the linter (max 20), hoist repeated `||`/`??` expressions into single consts first. A single-purpose, called-once function is a last resort permitted only when the logic still cannot be inlined under that limit: `currentTodos` in `scripts/core.ts` is the one sanctioned instance. Do not flag it.
- Model-facing strings in `scripts/prompts.ts` must not contain em-dashes themselves. The sole sanctioned em-dash in this repo is the `MEMORY.md` index line separator defined in the setup skill.

# Verification

No CI, by design. `bun run check`, `bun run typecheck`, and `bun run validate` run locally, and the lefthook pre-commit gate is the only enforcement that exists: never route around it (`--no-verify`, `LEFTHOOK=0`), because the smoke test inside it is the sole guard against silent Codex SDK breakage.

`bun run test` round-trips a real Codex review against the live API on every pre-commit. That spend is pre-approved; no other metered run here is. There is no automated test suite beyond `scripts/codex-smoke.test.ts`; hook logic is validated in the owner's live sessions, so never kill a running Claude Code, Cursor, or Pi process.

# Changing prompt behavior

Keep in sync: the prompt content in `scripts/prompts.ts` (SESSION_START plus the per-host `stopPrompt`/`liveMonitorPrompt` builders behind CLAUDE_PROMPTS, CURSOR_PROMPTS, and PI_PROMPTS) plus `skills/correctionguy/SKILL.md`. The reviewer prompts name the agent under review per host (Claude, Cursor Agent, Pi) and the host's instruction files; never hardcode "Claude" into shared reviewer text. The skill mirrors only the agent-facing discipline and carries no reviewer ruleset, so a change confined to reviewer-side detection needs no skill sync. The plugin's own live monitor heuristically flags every `prompts.ts` edit as "siblings not synced"; verify against the skill before acting on it. `.memory` layout mechanics belong in `skills/setup/SKILL.md`, not in the preambles. Do not re-add `commands/correctionguy.md`: Claude Code and Cursor both treat a same-named command and skill as one `/correctionguy`, and the skill is the sole on-demand surface.

# Releasing

Bump the version in all three manifests in lockstep (`package.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json`); it is easy to miss two. Releases are GitHub-only, with no npm publish. Full steps in `.memory/release-process.md`.

## Cursor Cloud specific instructions

This is a plugin, not a service: there is nothing to serve. The "app" is the hook entry points that run under a host. To exercise them without a host, pipe a JSON payload on stdin, e.g. `echo '{"conversation_id":"11111111-1111-1111-1111-111111111111"}' | bun scripts/cursor-correctionguy-hook.ts sessionStart` prints the session preamble. The Claude entry point is `bun scripts/correctionguy-hook.ts SessionStart` (its `HookInput` rejects `transcript_path: null`; omit the key instead of passing null). Verification commands live in `package.json`/`lefthook.yml`.

- Install with `bun install --ignore-scripts` (the update script does this). A plain `bun install` fails: the `prepare` step runs `lefthook install`, which errors because Cursor pins `core.hooksPath` to its own agent-hooks dir. The lefthook pre-commit gate therefore never fires here, so run `bun run check`, `bun run typecheck`, `bun run validate`, and `bun run test` by hand before committing.
- `bun run check` (oxlint/ultracite) needs Node `>=22.18.0` to load the `.ts` config files. The nvm default (`v22.22.2`) satisfies this in a login shell, but `/exec-daemon/node` (`v22.14.0`) can shadow it; if the check errors on the config extension, you are on the old Node.
- `ultracite check` scans the whole working tree, so it also lints untracked files the Cursor skills system drops into the checkout (e.g. `.agents/skills/**` and `skills-lock.json`). Those are not repo content; format issues reported there are the environment, not this codebase. Confirm the repo is clean by ignoring any flagged path under `.agents/`; every tracked file passes.
- `bun run validate` shells out to the `claude` CLI to validate the plugin manifests (no auth needed). It is not a bun dependency; install once with `npm i -g @anthropic-ai/claude-code` if missing.
- `bun run test` (the codex smoke test) makes a real, metered Codex API call and needs Codex auth. `scripts/codex.ts` builds `new Codex()` with no `apiKey`, so the SDK reads `~/.codex/auth.json`, not the `OPENAI_API_KEY` env var. Even when the `OPENAI_API_KEY` secret is present, authenticate once per VM with `printenv OPENAI_API_KEY | node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/bin/codex login --with-api-key` (writes `~/.codex/auth.json`). Without it the call 401s "Missing bearer" while the other four `scripts/*.test.ts` cases still pass; those four cover the Cursor steering logic and need no network.
- The lefthook pre-commit gate runs all four commands including the metered `bun run test`, so **every** `git commit` (even docs-only) fails until Codex is authenticated as above. Do not bypass the gate.
