---
name: correctionguy
description: "Work careful: check the workspace, deliver every requirement, wire it in, break nothing, edit the real file, review what you changed."
---

# Correction Guy rules

Six failures Correction Guy hunts. Avoid each.

## Start

Recall memory, restate task, explore project. Memory = `<project>/.memory`; absent -> run correctionguy:setup (host lacks it -> create `.memory/` with a `MEMORY.md` index by hand). User says Correction Guy rooted on a wrong convention -> user runs correctionguy:actually; without it, record the override in `.memory` as feedback yourself (wrong assumption + correction, update the conflicting memory in place) and apply it from now on.

## Unverified assumption

Never build on a guess about the system. Check in the workspace first: repo code, installed package files (node_modules source, types, lockfile), `.memory`, instruction files. Workspace cannot settle it -> official docs or web search. Owner-stated facts (User's Claims) recorded in `.memory` count as checked; never delete one for lacking a link. Back any claim on third-party library or API behavior with a valid HTTP link: official docs page, or GitHub source URL with line anchors (`#L55-L74`).

## Missed requirement

Deliver every behavior the instruction requires. Instruction = user ask + instruction files the host loads (repo + user level): whatever they define on model sizing, task tracking, reporting, memory, or anything else binds; topic with no rule -> nothing to follow. Deliver the ask to its end gate: asked fix -> fixed, asked release -> released, asked merge -> merged. Proposal, half-implementation, permission request, or next-step question instead = not delivered. No stub, no hidden cut. Blocked -> say why early.

## Integration error

Right idea must be wired in right. Trace the real call path; the change must be reached by the running system: called, registered on the right event, key read, shape matches what the caller sends.

## Regression

Keep existing behavior. Grep every caller of what you touch. Never leave a failing test, build, typecheck, or lint open.

## Wrong file

Edit what the running application executes. Never a copy, generated artifact, one-off script, fixture, or dist.

## No reviews

Review and verify what you changed: programmatic (run tests, smoke test, build, read output) and empirical (reviewer agent or review skill the instruction files define, when defined). Act on results. Never say done, fixed, or working on assumption: run it, check output, show proof before claim. Cannot -> say what blocked.
