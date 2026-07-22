# AGENTS.md

Working notes for agents in this repo.

- When asked to surface or "make visible" existing content (e.g. a hook's output), show it verbatim. Do not summarize, reword, shorten, or substitute your own phrasing for text the user did not explicitly ask to change. "Make X visible" changes the delivery channel, not the content.
- Verify changes with `bun run check`, `bun run typecheck`, and `bun run validate` before committing.
- Back any claim about third-party library or API behavior with a valid HTTP link — an official docs page, or a GitHub source URL with line anchors (e.g. `#L55-L74`).
- When you add or change a `package.json` script, run it once before committing. A script that has never been executed is unverified.
- When answering questions about a named CLI command or feature, check the feature-specific documentation before concluding from a broader reference page; `/goal` exists in Claude Code even though it was missed by only reading the slash-command listing. (2026-05-22)
- Preserve the user's exact question shape when correcting an answer; "does `/goal` exist?" is different from "can Claude set its own active `/goal`?" (2026-05-22)
- NO HACKS. Hit a wall: stop, fix the underlying flaw robustly, or say honestly that the task can't be done without hacks. "Couldn't complete because the repo lacked X" (with X then fixed properly) is a welcome answer; a workaround that breaks later is not.
- Do exactly what's asked: no unsolicited code, refactors, or extras. Note follow-up implications in the reply, but implement them only when asked. When the owner proposes an approach but invites improvement, improve it rather than implementing the naive version literally.
- When the planned approach hits a blocker, a policy issue, or a significant design fork, surface the options and let the owner pick; never unilaterally substitute a different approach.
- All source edits go through the editor tool (Edit / apply_patch), never scripted Bash edits (`python3`/`sed` loops); mechanical multi-file changes are N individual edits. Revert your own work via the editor, never git.
- Respect a rejection the first time; never re-run a command or test the user has declined.
- Never infer API or hook payload shapes from examples: run the real call or a live session, inspect the actual payload, then type from that. When live behavior contradicts published docs, live behavior is authoritative.
- The dated facts in this file and `.memory` (CLI, SDK, hook internals) go stale monthly; re-verify time-sensitive ones before relying on them. When a live observation contradicts a recorded verification, re-verify against current reality instead of explaining the observation away; the user's observation usually wins.
- Treat absence of a signal (missing logs, empty output, a hook that silently does nothing) as a strong hint, not proof; pair it with an active behavior test before concluding. When behavior diverges across hosts or machines, check version skew first.
- No speculative path guessing: locate the real path, dependency, or credential on the machine and use that single location (plus one documented env-var override), never a candidate list of guessed fallbacks.
- Two or more corrections in one thread -> stop and consolidate the lessons before continuing. When a hook or the user flags a violation, concede plainly and adjust; never argue it was harmless.
- After every change, report honestly on anything fragile or hacky; raise concerns when something feels wrong.
- Never use em-dashes or interpuncts: prose, code, prompt strings, release notes, chat replies. Use commas, colons, parentheses, or hyphens; plain natural language with no AI tells. The strings in `scripts/prompts.ts` are model-facing and must not contain em-dashes themselves, and any prompt that generates copy must state the ban. Sole local exception: the `MEMORY.md` index line separator defined in the setup skill.
- Lead a yes/no question with a direct yes or no; if unsure, say so rather than presenting a guess as fact. Deliver answers directly with no permission-seeking follow-ups; ask clarifying questions as plain prose with a recommended default plus reasoning.
- Treat subagent reports as leads, not facts; confirm against primary sources before acting on them. Be the orchestrator, not the worker: frame the problem rather than prescribing the solution.
- Aim optimization passes at architectural decisions and bold re-engineering, not micro-optimizations; judge the codebase as it currently is, without mining git logs for justification.
- Local dev runs on Bun only (`bun install`, `bun add`, `bun run`, `bun scripts/x.ts`); never npm, npx, or pnpm. Shipped code must still run under Node for Pi, so bun-only APIs (`Bun.env`, `Bun.file`) stay out of `scripts/` (see Hosts and the Pi Extension).
- Add or upgrade dependencies with `bun add` / `bun update` so versions are current; don't hand-edit `package.json` to add deps. Exception: `@earendil-works/pi-coding-agent` is managed by hand (peerDependency `"*"` plus a devDependencies copy; see Hosts and the Pi Extension).
- For fast-moving deps (`@openai/codex-sdk`, `@earendil-works/pi-coding-agent`), read the installed version's types and docs in `node_modules` before writing code against them; don't code from memory of an old API, and heed deprecation notices.
- Verification commands must surface real exit codes: never pipe through `| tail` or append `; true`. Run steps expected to take 10+ minutes in the background from the start with a hard time bound in the command itself (`gtimeout N ...`); keep quick probes in the foreground.
- Shell commands: atomic, small, readable; no long chained one-liners. On zsh, quote args, avoid readonly variable names (UID/EUID), and use `command <tool>` when an interactive alias could interfere.
- Drive interactive CLIs from non-TTY shells inside tmux (capture-pane / send-keys), not by piping newlines.
- Research order: configured MCPs first, context7 for framework and library docs, then web search (Exa/Parallel.ai); treat their quotas as infinite. Request OAuth directly when needed.

# Vocabulary

Shorthand the repository owner uses to request whole workflows. When the owner says one of these, run the full sequence without asking step by step, reporting each step's outcome briefly as it lands. The vocabulary lives on the injected guidance surfaces (SESSION_START, SKILL.md, command) since 3.6.0; "ship" replaced "one shot release"/"one shot merge" in 3.8.0.

- "Ship" a release: bump the version (all three manifests in lockstep: `package.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json`), commit, create the annotated tag, push, and publish the GitHub release. Full steps under Release Process below. (2026-07-12, renamed 2026-07-14)
- "Ship" a merge: once everything is done, open a PR, make CI pass, handle all review comments, and merge when everything is cleared. Context of the ask picks the sense. (2026-07-12, renamed 2026-07-14)
- Shipping rules must be stored in AGENTS.md or `.memory`. Told to ship where neither records them -> ask the user for clarification and record the answer before running. (2026-07-14)

# User's Claim

Facts the repository owner has stated about this project. They are sourced by the owner's statement: do not flag them as unsupported, and never delete one for lacking an external link.

- No CI workflow is intentional. Lint, formatting, typechecking, and manifest validation run locally via `bun run check`, `bun run typecheck`, and `bun run validate`. (2026-05-26)
- There is no automated test suite in this repo by design; hook logic is validated manually in live Claude Code sessions. Sole exception: `scripts/codex-smoke.test.ts`, owner-requested after `@openai/codex-sdk` 0.137.0 silently broke every review on gpt-5.6 models (the API rejects old CLIs with 400 "requires a newer version of Codex", and only on realistic-size payloads; trivial calls pass; upgrade path: https://github.com/openai/codex/releases). It round-trips a real stop review against the configured model and runs on pre-commit via lefthook. (2026-05-26, amended 2026-07-13)
- Never add helper functions just to deduplicate code; use es-toolkit, or duplicate the few lines instead. Inline closures (e.g. `const buildJson = (t) => ...`) created only to dedupe count as helpers too. When cyclomatic complexity trips the linter, first hoist repeated `||`/`??` expressions into single `const` bindings; a single-purpose, called-once function is permitted only as a genuine last resort, when the logic still cannot be inlined under the eslint `complexity` limit (max 20). Such a function is NOT a banned helper — e.g. `currentTodos` in `scripts/core.ts`, which reconstructs the session's todo list and would push `liveMonitorContext` past the complexity limit if inlined; do not flag it. (2026-05-27, clarified 2026-06-25)
- Never add comments. If you see one, delete it.
- Agent memory lives in a project-local `.memory` folder holding the real memory files; the agent's traditional memory directory (e.g. `~/.claude/projects/<slug>/memory`) is a symlink into `.memory`, so memories live with the repo. The direction matters: the real files sit in `.memory` and the `~/.claude` path is the symlink, never the reverse (that inversion was an actual mistake the owner corrected). If the real files ever end up in the traditional location, move them into `.memory` and re-point the symlink. Every memory, including a User's Claim, defaults to `.memory`; record one somewhere else (e.g. committed conventions in this file) only when a specific rule directs it there. This default is an official rule in the plugin prompts (SESSION_START, STOP_PROMPT, LIVE_MONITOR_PROMPT in `scripts/prompts.ts`, plus the skill and command). `.memory`, including `MEMORY.md`, must NOT be git-tracked; it is gitignored per the owner's direct correction ("MEMORY should not be tracked", 2026-06-26). Never `git add` anything under `.memory`; if a file there is ever tracked, `git rm --cached` it. (2026-06-25, expanded 2026-06-26)
- The user and agents work on the same checkout simultaneously; the user's parallel edits can appear in the working tree at any moment. Never `git reset`, `checkout`/`restore` over, `clean`, stash-drop, or otherwise remove or overwrite the user's work; if work genuinely collides, stop and politely ask the user. Baked into every guidance surface on 2026-07-08: `scripts/prompts.ts` (SESSION_START preamble, STOP_PROMPT block list, LIVE_MONITOR_PROMPT flag #10), `skills/correctionguy/SKILL.md` ("Never wipe user's work"), `commands/correctionguy.md` (item 6 "Preserve"), and this file. (2026-07-08)
- Do not info-bomb the user. Thinking silently for an hour and then dumping a 20-page report is bad: a giant wall after long silence hides the load-bearing points and stops the user from following and steering. Think out loud throughout the session, slowly and one idea at a time, keeping each point succinct and easy to glance over; prefer bullet lists and indented bullet lists over prose. This applies to the agent's own replies in every session with this user, and since v3.6.0 it is injected guidance on all plugin surfaces (SESSION_START, stop check nudge, live monitor flag 11, SKILL.md, command, this file). (2026-07-12)
- When authoring dynamic workflows (Workflow tool `agent()` calls), assess each stage's difficulty and set `model` per stage instead of letting everything inherit one tier. Ladder: Fable > Opus > Sonnet > Haiku. Explore/scan/grep/enumerate stages get `sonnet` or equivalent; drafting, root-causing a single item, and mid-weight synthesis get `opus`; adversarial verify, judge panels, final synthesis, and subtle correctness reasoning get `fable`. Escalate rapidly when intelligence matters: being cheap on a hard verify/judge stage is the worse failure mode (one-size-fits-all wastes either money on greps or quality on judgment calls). Per-stage routing is documented platform behavior (https://code.claude.com/docs/en/workflows); Fable sits above Opus (https://www.anthropic.com/news/claude-fable-5-mythos-5). This guidance is embedded in SESSION_START and mirrored in SKILL.md + command. (2026-07-02)

# Release Process

Cutting a release (e.g. minor bump 3.0.0 -> 3.1.0):

1. Bump the version in all three manifests in lockstep (easy to miss two of them): `package.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json`.
2. Verify with `bun run check`, `bun run typecheck`, `bun run validate` (validate parses the manifests).
3. Commit in conventional-commits style with a detailed body and NO Co-Authored-By trailer (repo history has none).
4. `git push origin main`.
5. Annotated tag: `git tag -a vX.Y.Z -m "<version plus a short summary>"`, then `git push origin vX.Y.Z`. Recent tags (v2.3.0, v3.0.0) are annotated; v2.2.0 was lightweight.
6. GitHub release: `gh release create vX.Y.Z --title "vX.Y.Z" --notes "..."`.

Facts around the process:

- No npm publish; releases are GitHub-only (there is no `publish`/`prepublish` script, and the package is not marked private).
- `git push` over HTTPS uses git's smart transfer protocol (https://git-scm.com/docs/http-protocol), a separate transport from the REST API. GitHub's REST rate limit (5,000 req/hr for authenticated users, https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) therefore only gates `gh release`/`gh api`, not `git push`. In this harness that REST budget is shared across all session tools/agents (per a harness system-reminder).
- Tag `v3.0.0` exists but has NO GitHub release; that release was skipped. v3.1.0 is the first GitHub release after v2.3.0. (2026-06-26)
- The Claude Code plugin cache (`~/.claude/plugins/cache/correctionguy/correctionguy/<ver>/`) has its own `node_modules`; a repo fix does not reach users until a release plus plugin update (or a manual `bun update` inside the cache dir).

# Injected Guidance Surfaces

When changing prompt behavior, the surfaces to keep in sync are the three strings in `scripts/prompts.ts` (SESSION_START, STOP_PROMPT, LIVE_MONITOR_PROMPT) PLUS the sibling reminders `skills/correctionguy/SKILL.md` and `commands/correctionguy.md`.

- Since 3.7.0 the `.memory` layout mechanics (create + gitignore `.memory`, merge the traditional memory dir in, symlink it, triage then mine past transcripts with fanned-out subagents — sonnet triage, sonnet miners by default, fast escalation on high-signal transcripts, high-entropy bar on what gets written) live in `skills/setup/SKILL.md` (`correctionguy:setup`). SESSION_START, the stop-check nudge, SKILL.md, and the command only point at the skill (with a one-clause manual fallback for hosts without the skill — in this repo only `.claude-plugin/plugin.json` declares a `skills` dir; `.cursor-plugin/plugin.json` declares hooks only and the Pi manifest is just `pi.extensions` in `package.json`). Changes to layout mechanics go in the setup skill, not back into the preambles.

- The two sibling files mirror the agent-facing discipline of SESSION_START (understand / track todos / remember-to-`.memory` / verify third-party / finish / run / review); they carry NO reviewer ruleset.
- So a change confined to the reviewer-side detection stance in STOP_PROMPT or LIVE_MONITOR_PROMPT (a new or strengthened flag, a detection prime like the v3.2.0 "Claude just made a serious AGENTS.md violation" prior) needs NO sibling sync; there is nothing in SKILL.md/command to mirror. Sync the siblings only when the shared agent-facing guidance itself changes.
- The plugin's own live monitor will still heuristically flag any `prompts.ts` edit as "siblings not synced"; verify against the files before acting on it.

# Codex Integration

- Sandbox reads: Codex's `sandboxMode: "read-only"` (the default in `scripts/codex.ts` unless `CORRECTIONGUY_YOLO=1`) is a write/network boundary, not a read boundary. All non-danger modes grant whole-filesystem READ, and `workingDirectory` does NOT confine reads. Proof in openai/codex (`codex-rs/`): macOS Seatbelt emits `(allow file-read*)` when `has_full_disk_read_access()`; Linux Landlock installs `path_beneath_rules(["/"], access_ro)`. read-only = read whole FS, no writes/network/exec; workspace-write adds only scoped writes; danger-full-access adds writes + network. Source: https://github.com/openai/codex/blob/main/codex-rs/linux-sandbox/src/landlock.rs. This is why STOP_PROMPT can tell Codex to read `transcript_path` directly (in `~/.claude/projects/<slug>/<uuid>.jsonl`, outside the project dir) to recover the real session state, since the Stop-hook snapshot is truncated and may lag. The read normally succeeds; denial (custom deny rule, absent field) is the edge case, so the prompt treats it as best-effort with a lean-"ok" fallback.
- Service tier: Codex CLI's `service_tier` config accepts only `flex`, `fast` (legacy, maps to `priority`), and catalog tier IDs; there is NO `"standard"` value. To run on the standard tier, omit the key entirely. correctionguy therefore leaves `service_tier` out of the Codex config unless `CORRECTIONGUY_SERVICE_TIER` is set (`scripts/codex.ts`, since v3.5.0). Verified 2026-07-10 against https://learn.chatgpt.com/docs/config-file/config-reference.
- SDK version gates new models: `@openai/codex-sdk` pins a vendored codex CLI at the same version (dep `@openai/codex`, binary under `@openai/codex-darwin-arm64/vendor/.../bin/codex`). The OpenAI API rejects requests from CLIs older than the requested model with 400 `invalid_request_error` "The 'gpt-5.6-sol' model requires a newer version of Codex." (observed 2026-07-13; upgrade path https://github.com/openai/codex/releases, SDK https://www.npmjs.com/package/@openai/codex-sdk).
  - The failure is silent: hooks catch review errors, log to stderr, and exit 0, so the plugin just "does nothing". Incident: correctionguy 3.6.0 shipped SDK 0.137.0; when the model moved to gpt-5.6-terra (07-10) then gpt-5.6-sol (07-12, via a user-level `CORRECTIONGUY_MODEL` override of the repo default), reviews failed silently for 3 days.
  - Trivial codex calls PASS on an outdated CLI; only realistic-size review payloads trigger the 400. Never smoke-test with a hello-world call. `scripts/codex-smoke.test.ts` round-trips a real stop review (>50k chars) and runs on pre-commit via lefthook (red on 0.137.0, green on 0.144.x, verified 2026-07-13).
  - Diagnose via `~/.codex/sessions/<y>/<m>/<d>/rollout-*.jsonl`: correctionguy runs have `originator: codex_sdk_ts`; broken ones end `task_complete` with `last_agent_message: null` in ~3-5s. The true error surfaces on stderr when running the hook manually with a real transcript.
  - A repo-side SDK fix does not reach the Claude Code plugin cache until a release plus plugin update (see Release Process).

# Hosts and the Pi Extension

correctionguy ships for three hosts: Claude Code, Cursor, and Pi (the pi.dev coding agent).

- Pi entrypoint is `scripts/pi-extension.ts` (a default-export factory), with `scripts/pi-adapter.ts` mapping Pi session entries to and from the shared `core.ts`/`runHook` pipeline.
- Unlike the Claude/Cursor subprocess hooks, the Pi extension runs in-process: `turn_end` -> live monitor (inject via `deliverAs:"steer"`); `agent_end` -> stop check (block via `sendMessage` `followUp`+`triggerTurn` with a `blockCount` loop guard reset on user `input`/`session_start`); first `before_agent_start` -> once-per-session prelude.
- Pi loads extensions under Node via jiti, not bun. So `scripts/codex.ts` MUST read `process.env`, never `Bun.env` (bun supports `process.env` too, so the Claude/Cursor hooks keep working). Never revert `codex.ts` to `Bun.env`; it silently breaks Pi.
- Per Pi packaging docs, its bundled core packages go in `peerDependencies` with `"*"`: `@earendil-works/pi-coding-agent` is there (plus a `devDependencies` copy for local `tsc`); the import is type-only so there is no runtime dep. Keep it out of `dependencies` (that would double-bundle what Pi provides).
- The Pi "manifest" is the `pi.extensions` field in `package.json`; `scripts/validate.ts` checks those paths exist.

# Live Monitor Data Sources: Todos

Researched 2026-06-25 and verified against official docs.

- There IS a direct hook API for todos. Claude Code's PostToolUse/PostToolBatch hook input carries `tool_input` AND `tool_response` for each tool call. So `TodoWrite.tool_input.todos` is the full list on each call, and `TaskList.tool_output.tasks` returns the full current list; `TaskCreate`/`TaskUpdate` inputs are deltas (`taskId`, `status`, ...). The plugin already receives these as `tool_calls` and passes them to the monitor as `current_tool_batch` (with both input and response). An earlier "transcript-only" framing was wrong; todos are an API channel.
- The modern default is Task tools; no `~/.claude/todos/` file exists.
- `currentTodos` in `scripts/core.ts` reconstructs the resolved full list in one pass at any hook fire (the current batch may not touch todos): it reads each task's real id and subject straight from the `Task #N created successfully:` tool_result (NOT synthetic creation-order counting), replays `TaskUpdate` status changes by that id, and falls back to the latest `TodoWrite` snapshot. It stays a single function because inlining it trips eslint complexity (>20); the helper-ban claim above allows a function as the last resort for exactly that.
- Cursor exposes neither todos nor chat title to hooks (not in any payload, not in the transcript); they degrade to empty.
- Sources (verified): hook inputs (`session_title` only on SessionStart; PostToolUse carries `tool_input`/`tool_response`): https://code.claude.com/docs/en/hooks.md ; todos as a tool channel (TodoWrite `tool_input.todos` is the full list; `TaskCreate`/`TaskUpdate` by `taskId`; `TaskList` tool result is a snapshot; the id comes back in the `tool_result` as `{ task: { id, subject } }`; read keys defensively): https://code.claude.com/docs/en/agent-sdk/todo-tracking.md ; `/rename` is a built-in command, not a tool: https://code.claude.com/docs/en/commands

# Session Titles Are Not Programmatically Settable

Verified 2026-06-26 against the Claude Code 2.1.193 binary and live tests in a real session. There are TWO distinct titles, which is the source of every contradiction in this area.

1. Session name (shown in the `/resume` picker and session list). In-memory it is a custom title from `/rename` falling back to an auto-generated title, with a UI event driving the redraw. NOT settable by any hook, tool, or file write. The auto `ai-title` is produced by an internal forked "kebab-case 2-4 words" model call, persisted to the in-memory field with a redraw. Regeneration is SKIPPED if the session already has a title, so the first auto-title sticks even after the task pivots. The JSONL is read for the title only at load/resume (last ~64KB; `customTitle` wins over `aiTitle`). Appending `ai-title`/`custom-title` records does NOT move the live title (the in-memory cache is not refreshed). `~/.claude/sessions/<pid>.json` has NO `name` field in 2.1.193, and CC overwrites that file on every status tick, discarding unknown keys.
2. Terminal tab/window title (the emulator's tab). Set by writing an OSC sequence (`\033]0;TITLE\007`) to the TTY. CC writes it natively; disable CC's writer with `CLAUDE_CODE_DISABLE_TERMINAL_TITLE=1` (present in the binary). A hook CAN set this (it runs in CC's process and can write `/dev/tty`); the agent's own Bash tool CANNOT (no controlling TTY; confirmed `/dev/tty` "device not configured"). You can also write the OSC sequence to the CC process's controlling terminal device directly. This is what `jkgeekJack/cc-session-title` does (OSC tab title); `dxrayhq/claude-session-labels` surfaces its label via a custom `statusLine` plus the `custom-title` it writes for the picker. Neither changes the session NAME.

Hook visibility: Claude Code's SessionStart input includes `session_title` (the current name from `--name`/`/rename`), and a SessionStart hook can emit `sessionTitle`; the field is NOT in PostToolBatch/Stop inputs, so the live monitor and stop check cannot read it directly. `/rename` is a built-in command (not a tool) and writes no `ai-title` transcript record, so an explicit rename is invisible to the monitor; at PostToolBatch time the only available title source is the latest `{"type":"ai-title","aiTitle":...}` transcript record (auto-generated).

Live tests that session: appending `{"type":"custom-title","customTitle":...,"sessionId":...}` left the live title unchanged (picker-only on next load); writing `name` to `sessions/<pid>.json` was wiped within seconds; `/rename test` works (in-memory path). The authentic `/rename` record in 2.1.193 IS `{"type":"custom-title","customTitle":"test","sessionId":...}`, identical to the injected format, so the format was never the problem; the in-memory cache is.

Consequence for this repo: the prompts carry NO title/`session_title`/`/rename` mention. Never instruct the model to rename and never flag it for not renaming (it has no mechanism). The `session_title` plumbing was removed 2026-06-26 from `scripts/core.ts`, `correctionguy.ts`, `cursor-adapter.ts`, both hook entry points, and `pi-extension.ts`; the monitor no longer computes or sees any session title. For live per-tab visibility the only lever is an OSC terminal-title hook (sets the tab title, not the `/resume` name).

Sources: open feature requests https://github.com/anthropics/claude-code/issues/25045 , /29355 , /33165 ; https://github.com/jkgeekJack/cc-session-title ; https://github.com/dxrayhq/claude-session-labels ; CC 2.1.193 behavior, verified against the binary and live tests (the `CLAUDE_CODE_DISABLE_TERMINAL_TITLE` env var).

# Safeguards

- No `rm -rf`, no `git clean -fdx`, no forced deletes; use `trash` (reversible). Avoid deleting files at all; when a deletion is genuinely unavoidable, ask the user to remove it. The one exception: temporary artifacts this session created may be trashed. "The contents were reconstructible" is not a defense.
- Stop processes by PID, never `pkill -f` a pattern that could match your own shell. Never kill a running Claude Code, Cursor, or Pi process to free a port or resource; hook logic is validated in the owner's live sessions and killing one destroys their state. Never disturb the user's running sessions or reset live state without asking.
- Never read, edit, or print `.env` files or credential stores (`~/.codex/auth.json` and friends). Check presence with `Boolean(process.env.X)` only; never print values and never fill in dummy values. To set a secret, pipe it straight to the provider and report key names plus status only.
- Never dump full JSON responses that may contain secrets; allowlist the fields you need. Hook code logs caught Codex errors to stderr, so scrub outbound request headers from provider HTTP errors before they reach logs, and treat any key visible in an error payload as exposed.
- A feature request is not permission to spend: ask before any run that meters quota or sends real API requests; free read-only probes are fine. Sanctioned exception: `bun run test` round-trips a real Codex review and runs on every pre-commit by design; that spend is pre-approved.
- Guard self-referential file operations (copying onto a symlink target you are reading from, like the `.memory` link or the plugin cache); make destructive or state-mutating commands idempotent.

# Code Style

- Fail fast and visibly inside script logic: invalid input throws, no `??` fallbacks masking bad data, no double validation (trust the library), no defensive layers. The hook entry points are the one sanctioned catch boundary: they log to stderr and exit 0 so a plugin failure never breaks the host session.
- Degrade legibly, never falsely: a source a host does not expose degrades to empty or unknown, never to a fabricated value, and a failed check must never read as a pass.
- Code is a liability; every line is maintenance. Delete and simplify first, and build the simplest version that works; for each addition ask whether it is needed now, deletable, and solving a real problem.
- Write modern, canonical-library-first code on the first pass: before coding in a domain new to the repo, enumerate the current canonical libraries and build on them. Hand-rolled tree-walkers, text-extractors, and finders are automatic rewrite triggers.
- Write lint-clean modern TS from the start: `for...of` / `.entries()`, destructuring, lookup tables over nested ternaries, async/await only (no `.then` chains, no `forEach`). Run `bun run check` on each new file as it lands, not in one sweep at the end; code that needs a big fix sweep afterward is itself the smell.
- No new regex. Validate strings structurally: `startsWith`/`endsWith`, split on delimiters, zod format validators, or a real parser. Pre-existing regexes stay (don't churn them); a regex mirroring an external contract exactly is the one exception.
- Name function inputs with an object, not positional params; keep lists explicit; no terse throwaway destructuring or magic string slicing.
- When renaming a feature or a vocabulary term, rename the full surface (prompts, SKILL.md, command, docs, release notes, this file), not just one occurrence; the 3.8.0 "ship" rename is the template.
- Hooks fire on every batch and setup re-runs: design periodic or repeatable operations to be greedy, idempotent, and convergent.
- Don't mutate code shape just to appease the formatter or a lint rule; if an opaque `ultracite`/`oxfmt` diff persists, surface it to the owner.

# TypeScript

- Never use `typeof` or `as` for runtime narrowing; every runtime narrow (hook payloads, transcript records, unknown errors, env) goes through `z.object(...).safeParse(x)`. Type-position `typeof` (`ReturnType<typeof f>`) is a different feature and stays; convert `typeof` narrows to zod when touching that code.
- No `as` casts (only `import * as` and `as const`); never cast to `any` to silence a type error; fix the type at the source.
- Model data as a zod schema and derive the type with `z.infer` instead of standalone `interface`/`type` declarations; prefer types exported by the Codex SDK and Pi over redefined interfaces.
- Keep type-only imports `import type` (erased at runtime, no runtime dependency); that discipline is what keeps `@earendil-works/pi-coding-agent` out of the runtime deps.
- A missing field maps to null or undefined, never `''`/`0`/`false`; never hardcode values in transforms. Prefer zod-parsed access over long optional chains.
- Read env through one zod-validated module over `process.env` (never `Bun.env`; Pi loads under Node). Every `CORRECTIONGUY_*` var is optional: it parses to undefined and its feature degrades at the use site. The plugin must never crash at load over env, and never assign `process.env.FOO = ...` to paper over a missing var.

# Git

- Commit only your own hunks: extract your part of a co-edited file with `git apply --cached`, never stage the whole file (whole-file add is fine only for files this session created). Inspect `git status` and `git diff --cached` untruncated immediately before committing; never trust a minutes-old diff.
- Never force-push, never amend a pushed commit. On any concurrent-commit signal (rejected push, unexpected remote sha, staged hunks you don't recognize), stop and ask; `--force-with-lease` after a fetch provides no protection.
- Never route around the lefthook pre-commit gate (`--no-verify`, `LEFTHOOK=0`) on your own; with no CI, it is the only enforcement, and the smoke test in it is the sole guard against silent Codex SDK breakage. If the gate fails unattended, preserve the work reset-proof (`git stash create` plus a wip ref), record the intended message, and report the blocker.
- Commit often: small commits for small changes, conventional-commits style with a detailed body and no Co-Authored-By trailer on every commit, not just release commits (Release Process step 3). Commit and push after each verified milestone; don't sit on a finished diff.
- Never commit temporary artifacts (screenshots, transcript dumps, scratch files); write them to the session scratchpad with absolute paths, and `trash` any that land in the worktree.
- When a change alters operational semantics (hook behavior, release mechanics, guidance surfaces, the pre-commit gate), update this file or the relevant `.memory` note in the same commit.
- When work goes through a PR and the owner has not said "ship", open the PR and stop; the owner merges.

# Reviews

- Adversarial reviews run on an unhinted, free-roaming external reviewer: pass only the target scope, never hypotheses, suspected bugs, checklists, exclusions, or concern cues; steering reintroduces the author's blind spots. One fresh reviewer per round; continued context biases it. Known-issue context belongs in the PR description for the owner, never in the reviewer prompt.
- Never put a score target in a review prompt; specify rubric mechanics only and let the number come from the reviewer. Require cited per-dimension justification and discard uncited reviews. Phrase audit subjects as open questions, not asserted conclusions.
- When a review was user-initiated, present the findings first and ask before applying fixes; an autonomous goal loop may proceed on its own mandate.
