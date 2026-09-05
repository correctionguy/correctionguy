---
name: reviewer-focus-assume-verify-drift
description: Reviewer prompts hunt three things first - assumed instead of checked, claimed done with no verification, drifted off the user ask; everything else secondary
metadata:
  type: feedback
---

Owner rule (2026-09-05): Correction Guy's main hunt is three failures. (1) The agent assumed something (API, package, platform, tool, or repo behavior) instead of checking via web search, official docs, installed package files (node_modules source, types, lockfile), or a look at the repo. (2) The agent claimed done, fixed, working, or verified with no explicit verification in the transcript: no run, test, build, check, or output backing the claim. (3) The agent drifted off what the user asked. All other flags (repo instructions, failing output, swallowed errors, wiping user work, todos, memory, info-bomb, BS talk) are secondary and fire only when blatant.

**Why:** Plumbing nudges were crowding out the failures that cost the most. The owner asked to stop nitpicking and center the reviewer on assumption, unverified completion claims, and drift.

**How to apply:** Live monitor flags 1-3 are the three failures, with a "Main hunt" line ahead of the list; the stop check names the same three before its verdict rules; SESSION_START and `skills/correctionguy/SKILL.md` carry the agent-facing side (never assume, read package files, never say done without proof). Deleting the agent's own temp artifacts, scratch, or intermediary files is never a flag; only the user's work is protected (see [[user-agents-work-simultaneously]]). No-nitpick bar still applies on top (see [[no-nitpick]]).
