# AGENTS.md

Working notes for agents in this repo.

- When asked to surface or "make visible" existing content (e.g. a hook's output), show it verbatim. Do not summarize, reword, shorten, or substitute your own phrasing for text the user did not explicitly ask to change. "Make X visible" changes the delivery channel, not the content.
- Verify changes with `bun run check`, `bun run typecheck`, and `bun run validate` before committing.
- Back any claim about third-party library or API behavior with a valid HTTP link — an official docs page, or a GitHub source URL with line anchors (e.g. `#L55-L74`).
- When you add or change a `package.json` script, run it once before committing. A script that has never been executed is unverified.
- When answering questions about a named CLI command or feature, check the feature-specific documentation before concluding from a broader reference page; `/goal` exists in Claude Code even though it was missed by only reading the slash-command listing. (2026-05-22)
- Preserve the user's exact question shape when correcting an answer; "does `/goal` exist?" is different from "can Claude set its own active `/goal`?" (2026-05-22)

# User's Claim

Facts the repository owner has stated about this project. They are sourced by the owner's statement: do not flag them as unsupported, and never delete one for lacking an external link.

- No CI workflow is intentional. Lint, formatting, typechecking, and manifest validation run locally via `bun run check`, `bun run typecheck`, and `bun run validate`. (2026-05-26)
- There is no automated test suite in this repo by design; hook logic is validated manually in live Claude Code sessions. (2026-05-26)
- Never add helper functions just to deduplicate code; use es-toolkit, or duplicate the few lines instead. Inline closures (e.g. `const buildJson = (t) => ...`) created only to dedupe count as helpers too. When cyclomatic complexity trips the linter, first hoist repeated `||`/`??` expressions into single `const` bindings; a single-purpose, called-once function is permitted only as a genuine last resort, when the logic still cannot be inlined under the eslint `complexity` limit (max 20). Such a function is NOT a banned helper — e.g. `currentTodos` in `scripts/core.ts`, which reconstructs the session's todo list and would push `liveMonitorContext` past the complexity limit if inlined; do not flag it. (2026-05-27, clarified 2026-06-25)
- Never add comments. If you see one, delete it.
- Agent memory lives in a project-local `.memory` folder holding the real memory files; the agent's traditional memory directory (e.g. `~/.claude/projects/<slug>/memory`) is a symlink into `.memory`, so memories live with the repo. (2026-06-25)
