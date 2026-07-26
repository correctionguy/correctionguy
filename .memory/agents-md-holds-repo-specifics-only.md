---
name: agents-md-holds-repo-specifics-only
description: AGENTS.md carries only repo-specific quirks and traps; general discipline lives in the owner's global agent instructions, background facts in .memory
metadata:
  type: feedback
---

Owner rule (2026-07-26): AGENTS.md holds repo-specific content only. The bar for keeping a line is that it be unique and distinguished, something special. Anything a capable agent already has or can re-derive gets deleted.

Three layers, each owning its content exactly once:

- The owner's global agent instructions, which load in every session across all projects: general working discipline, code style, git, safeguards, communication.
- This repo's `AGENTS.md`: only what is true here and nowhere else. Traps, local rules that override a global one, the verification gate, prompt-surface sync, the lockstep version bump.
- `.memory/*.md`, indexed by `MEMORY.md`: background facts loaded on demand when their topic comes up.

Applied 2026-07-26 following https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models (Rule 3 progressive disclosure, Rule 4 no repeated guidance across layers). AGENTS.md went from 174 lines to 34, about a 88% byte cut, with `bun run check`, `typecheck`, and `validate` green after.

**Why:** The file had grown into a union of all three layers. Most bullets restated the global instructions almost verbatim, and every long section (release process, session titles, live monitor todo sources, Codex integration, Pi hosting) duplicated a `.memory` file that was already richer than the AGENTS.md copy.

**How to apply:** Before adding to AGENTS.md, ask which layer owns the fact. General discipline goes to the global file, background to `.memory`, and only a repo-specific trap stays here. Verified detail that makes the split safe: the reviewer prompts in `scripts/prompts.ts` cite AGENTS.md for _repo own instructions_ only (line 34 names the helper-function ban as the example), and the reviewer carries its own integrity ruleset inline. The Codex reviewer subprocess reads this repo, not the owner's global file, so a rule that only matters to the reviewer must stay in AGENTS.md. Do not "restore" deleted general-discipline rules on the theory that the reviewer needs them. See [[high-entropy-memory-mining]], [[release-process]], [[pi-extension-integration]].
