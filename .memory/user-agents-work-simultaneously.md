---
name: user-agents-work-simultaneously
description: User and agents share the checkout live; never git reset or remove user's work — collision means stop and ask
metadata:
  type: feedback
---

The user and agents work on the same checkout simultaneously (owner's statement, 2026-07-08). Never `git reset`, `checkout`/`restore` over, `clean`, stash-drop, or otherwise remove or overwrite the user's work. If work genuinely collides, stop and politely ask the user. The agent's own temp artifacts, scratch, or intermediary files are not user work: deleting them is fine and never a flag (owner loosening, 2026-09-05).

**Why:** Parallel edits from the user can appear in the working tree at any moment; destructive git operations silently destroy them.

**How to apply:** Binding on my own conduct in this checkout. It was baked into every plugin surface on 2026-07-08 and retired from all of them on 2026-09-14: the owner's global safeguards own it, and the reviewer flags it only as a missed requirement when an instruction file states it ([[reviewer-six-failures]]). Recorded as a User's Claim per [[memories-default-to-dot-memory]].
