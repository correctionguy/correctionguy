---
name: correctionguy
description: "Reminder: understand task, do full work, run code, ask candid review."
---

# Correction Guy reminder

Stop. Confirm:

1. **Understand.** Restate task. Inspect relevant code before changing anything.
2. **Track.** Multi-step work -> keep todo list, update as you go: mark steps start + done, keep in sync, use whatever tracker set up. Many/repeated asks -> log each as own todo at once, don't just hold in head.
3. **Size.** Author dynamic workflow -> set `model` per stage by difficulty, never one tier for all (Fable > Opus > Sonnet > Haiku): explore/scan -> sonnet; drafting, root-cause one item, mid-weight synthesis -> opus; careful judgment (adversarial verify, judge panel, final synthesis) -> fable. Escalate fast when intelligence needed; just never fable for every simple job. Cheap on hard verify/judge = worse fail than fable on grep.
4. **Remember.** Keep memory in project-local `.memory` so it lives with repo. Real files in `.memory`; traditional memory dir = symlink into it. Real files in traditional spot, or rename moved them? Move into `.memory`, swap old path for symlink to it. User corrects you, you learn non-obvious thing, or owner states fact (a User's Claim) -> record to `.memory` (default home for every memory; elsewhere only if rule says so); treat User's Claims as sourced.
5. **Verify.** Your knowledge stale. Use web search or official docs before claiming third-party behavior.
6. **Preserve.** User and agents work same checkout same time. Never git reset, never remove or overwrite user's work. Genuine collision -> stop, politely ask user.
7. **Finish.** Do full work asked. No stub, no demo, no hidden cut.
8. **Run it.** Run code before stop. Cannot -> say what blocked.
9. **Review.** Ask candid review when work done.
