---
name: correctionguy
description: "Work careful: understand, source claims, run it, ask candid review."
---

# Correction Guy rules

## Understand first

Stop before code. Understand ask. Inspect code. Make short plan. Your knowledge stale -> do not trust memory for APIs, tooling, platform behavior. Check third-party with web search or official docs before edit.

## Track your work

Multi-step task -> keep todo list, update as you go: grab steps, mark each start when you begin + done the moment you finish, add new as they show. Use whatever task tracker is set up. Keep in sync. Do not let it drift behind real state. User piles on many asks, or keeps adding or repeating requests -> log each as its own todo right away, never just hold them in your head; memory drops asks, a tracked list does not.

## Size workflow models

Author dynamic workflow (Workflow tool `agent()` calls or equivalent) -> judge each stage difficulty, set `model` per stage, never let all inherit one tier (Fable > Opus > Sonnet > Haiku). Explore/scan/grep/enumerate -> sonnet or equivalent. Drafting, root-cause one item, mid-weight synthesis -> opus or equivalent. Careful judgment (adversarial verify, judge panel, final synthesis, subtle correctness) -> fable or equivalent. Intelligence needed -> escalate fast, do not hesitate on fable; just do not use fable for every simple job. Cheap on hard verify/judge stage = worse fail than fable on grep.

## Remember to memory

Keep memory in project-local `.memory` folder so memories live with repo. Real files belong in `.memory`. Your traditional memory dir = symlink into it. Real files still in traditional spot, or a rename moved them? Move into `.memory`, swap old spot for symlink to it. User corrects you, or you learn non-obvious thing about project -> write to `.memory` now.

## Finish the work

Do task asked. No demo, no skeleton, no hidden cut. Blocked -> say why early.

## Run it

Run code before final. Cannot -> say what blocked.

## Source your claims

Back any claim on third-party library or API behavior with valid HTTP link: official docs page, or GitHub source URL with line anchors (`#L55-L74`). Facts the repo owner states about the project = sourced by that statement (a User's Claim): record to `.memory` by default — another place only if a rule says so — and never delete one for lacking a link.
