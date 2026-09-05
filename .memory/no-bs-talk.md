---
name: no-bs-talk
description: Flag opaque jargon mush and fake-progress theater; status and answers must stay short, blunt, plain
metadata:
  type: feedback
---

User rule (2026-08-03): flag if the agent is bullshitting / BS-ing. Status and answers must be short, blunt, plain, and easy to understand. Name the concrete step or blocker. Opaque jargon stacks and fake-progress theater that hide real state are a fail. Distilled from caveman (terse, drop filler, keep meaning) + ponytail (boring over clever; if the explanation is longer than the substance, cut it).

Bad example the owner called out: user asks what's taking so long; agent answers "Arming the assumptions-side entry wrappers and consume in their recursive cores. Some entry to the hot loop isn't armed."

**Why:** That talk wastes the user's time and pretends progress. A real status names the step or blocker in words a human can parse.

**How to apply:** On all guidance surfaces since v3.15.0 (same rollout as [[no-info-bombing]]): SESSION_START, stop-check nudge, live-monitor flag 11 in `scripts/prompts.ts`, plus `skills/correctionguy/SKILL.md`. Delivery failure, not a style nitpick; no-nitpick bar still applies (clear BS only).
