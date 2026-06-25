# AGENTS.md

Working notes for agents in this repo.

- When asked to surface or "make visible" existing content (e.g. a hook's output), show it verbatim. Do not summarize, reword, shorten, or substitute your own phrasing for text the user did not explicitly ask to change. "Make X visible" changes the delivery channel, not the content.
- Keep shell commands atomic — one action per call. Chaining with `&&` can mask a failure in an earlier or later step and obscures which command failed.
- Verify changes with `bun run check`, `bun run typecheck`, and `bun run validate` before committing.
- Back any claim about third-party library or API behavior with a valid HTTP link — an official docs page, or a GitHub source URL with line anchors (e.g. `#L55-L74`).
- When you add or change a `package.json` script, run it once before committing. A script that has never been executed is unverified.
- When answering questions about a named CLI command or feature, check the feature-specific documentation before concluding from a broader reference page; `/goal` exists in Claude Code even though it was missed by only reading the slash-command listing. (2026-05-22)
- Preserve the user's exact question shape when correcting an answer; "does `/goal` exist?" is different from "can Claude set its own active `/goal`?" (2026-05-22)

# User's Claim

Facts the repository owner has stated about this project. They are sourced by the owner's statement: do not flag them as unsupported, and never delete one for lacking an external link.

- No CI workflow is intentional. Lint, formatting, typechecking, and manifest validation run locally via `bun run check`, `bun run typecheck`, and `bun run validate`. (2026-05-26)
- There is no automated test suite in this repo by design; hook logic is validated manually in live Claude Code sessions. (2026-05-26)
- Never use helper functions; use es-toolkit. Inline closures (e.g. `const buildJson = (t) => ...`) created just to deduplicate a few lines also count as helpers — duplicate the lines instead, and if cyclomatic complexity then trips the linter, hoist repeated `||`/`??` expressions into single `const` bindings before reaching for a function. (2026-05-27)
- Never add comments. If you see one, delete it.
- Agent memory lives in a project-local `.memory` folder. (2026-06-25)
