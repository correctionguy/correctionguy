---
name: actually
description: "User says Correction Guy rooted on old, outdated, or wrong conventions; record the override in .memory and apply it from now on."
argument-hint: "[correction]"
disable-model-invocation: true
---

# Actually

User says Correction Guy (or guidance you followed from it) rooted on an old, outdated, or wrong convention. Override that now and remember it for every later turn and session. The correction is the text the user passed with this skill; the host appends it after these instructions.

## Do this now

1. Restate in one glanceable pair: the wrong assumption you or Correction Guy were using, and the correct rule the user wants.
2. No correction passed, and transcript does not already spell it -> ask once for the correction, then continue. Do not invent it.
3. Read `.memory/MEMORY.md`, open any conflicting `.memory/*.md`, and check AGENTS.md only for repo-specific traps that the old convention claimed. Prefer updating an existing memory in place when it is the same fact; never fork a duplicate. Later correction wins.
4. Write or update one bullet, on one line, in the matching snake_case topic file under `.memory` (no frontmatter). Record the wrong assumption AND the correction as the trap and the correct move, with the exact command, flag, path, or error string. Public-Wikipedia bar (no device, Slack, or environment details). A new topic file gets a `- [[file]]` line in the `## Index` of `MEMORY.md`.
5. Apply the new rule for the rest of this session. Stop citing or enforcing the old convention. If live work still follows the old rule, fix that work now.
6. Report in glanceable bullets: what changed, which memory file, what you will do differently. No wall.
