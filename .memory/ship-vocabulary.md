---
name: ship-vocabulary
description: '"ship" = run the full delivery sequence (release or merge) end to end, no ask between steps; shipping rules must be recorded in AGENTS.md or .memory, else ask + record first'
metadata:
  type: feedback
---

User-defined shorthand (2026-07-12 as "one shot release"/"one shot merge", renamed to "ship" 2026-07-14), recorded in AGENTS.md Vocabulary and on the injected guidance surfaces (SESSION_START, SKILL.md, command):

- "Ship" a release = bump version, commit, tag, push, release — the full [[release-process]] (3 manifests in lockstep, annotated tag, GitHub-only release).
- "Ship" a merge = once everything is done: open PR, make CI pass, handle all review comments, merge when everything is cleared.
- Context of the ask picks the sense.
- Shipping rules must be stored in AGENTS.md or `.memory`. If neither records them for the project at hand, the agent must ask the user for clarification and record the answer before running.

**Why:** The user wants one word to trigger the whole delivery workflow, and wants the procedure itself durably recorded rather than improvised per session.

**How to apply:** On "ship", execute the full sequence end to end without pausing to ask between steps; report each step's outcome briefly as it lands (see [[no-info-bombing]]). No recorded shipping rules -> stop, ask, record, then run.
