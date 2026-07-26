# AGENTS.md

Repo-specific notes only. General working discipline is not repeated here. Background facts live in `.memory/`, indexed by `.memory/MEMORY.md`; load one when its topic comes up.

correctionguy ships one plugin for three hosts: Claude Code, Cursor, and Pi (pi.dev). The Claude and Cursor hooks run as subprocesses; the Pi extension runs in-process. Cursor exposes neither todos nor chat title to hooks, so both degrade to empty.

# Traps

- Local dev is Bun, but shipped code must run under Node: Pi loads extensions via jiti, not bun. Bun-only APIs (`Bun.env`, `Bun.file`) stay out of `scripts/` entirely. `scripts/codex.ts` must read `process.env`; reverting it to `Bun.env` silently breaks the Pi host while Claude and Cursor keep working.
- `@earendil-works/pi-coding-agent` is managed by hand, never via `bun add`: a `peerDependencies` entry of `"*"` plus a `devDependencies` copy for local `tsc`. Keep it out of `dependencies`, which would double-bundle what Pi already provides. The Pi manifest is the `pi.extensions` field in `package.json`, and `scripts/validate.ts` checks those paths exist.
- Hook entry points are the one sanctioned catch boundary: they log to stderr and exit 0 so a plugin failure never breaks the host session. Everywhere else, fail fast and visibly.
- Every `CORRECTIONGUY_*` env var is optional. The plugin must never crash at load over env; a missing var degrades its own feature at the use site.
- A repo fix does not reach Claude Code users until a release plus a plugin update: the plugin cache (`~/.claude/plugins/cache/correctionguy/correctionguy/<ver>/`) carries its own `node_modules`.
- Never smoke-test Codex with a trivial call. Trivial calls pass on an SDK whose vendored CLI is too old for the requested model; only realistic-size payloads surface the 400, and hooks swallow the error and exit 0, so breakage looks like the plugin doing nothing. See `.memory/codex-sdk-version-gates-new-models.md`.

# Local rules that override the global ones

- Never add comments. If you see one, delete it.
- Never add helper functions to deduplicate, including inline closures created only to dedupe; use es-toolkit or duplicate the few lines. When cyclomatic complexity trips the linter (max 20), hoist repeated `||`/`??` expressions into single consts first. A single-purpose, called-once function is a last resort permitted only when the logic still cannot be inlined under that limit: `currentTodos` in `scripts/core.ts` is the one sanctioned instance. Do not flag it.
- Model-facing strings in `scripts/prompts.ts` must not contain em-dashes themselves. The sole sanctioned em-dash in this repo is the `MEMORY.md` index line separator defined in the setup skill.

# Verification

No CI, by design. `bun run check`, `bun run typecheck`, and `bun run validate` run locally, and the lefthook pre-commit gate is the only enforcement that exists: never route around it (`--no-verify`, `LEFTHOOK=0`), because the smoke test inside it is the sole guard against silent Codex SDK breakage.

`bun run test` round-trips a real Codex review against the live API on every pre-commit. That spend is pre-approved; no other metered run here is. There is no automated test suite beyond `scripts/codex-smoke.test.ts`; hook logic is validated in the owner's live sessions, so never kill a running Claude Code, Cursor, or Pi process.

# Changing prompt behavior

Keep in sync: the three strings in `scripts/prompts.ts` (SESSION_START, STOP_PROMPT, LIVE_MONITOR_PROMPT) plus `skills/correctionguy/SKILL.md` and `commands/correctionguy.md`. The two siblings mirror only the agent-facing discipline and carry no reviewer ruleset, so a change confined to reviewer-side detection needs no sibling sync. The plugin's own live monitor heuristically flags every `prompts.ts` edit as "siblings not synced"; verify against the files before acting on it. `.memory` layout mechanics belong in `skills/setup/SKILL.md`, not in the preambles.

# Releasing

Bump the version in all three manifests in lockstep (`package.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json`); it is easy to miss two. Releases are GitHub-only, with no npm publish. Full steps in `.memory/release-process.md`.
