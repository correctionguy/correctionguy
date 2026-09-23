---
name: reviewer-corrections-are-imperatives
description: Reviewer corrections are verb-first imperatives to the agent; a tenseless fragment inverts polarity; a secret is a token-shaped value, never a variable name
metadata:
  type: feedback
---

Caveman style drops auxiliaries and tense, so a fragment like "Claude send no notification" reads as "sent none, should have" and the agent does the opposite. Both reviewer prompts in `scripts/prompts.ts` require a correction addressed to the agent, verb first: "Do not send notification", "Run tests before claim". A keyword-shaped secret check flags variable names every memory legitimately uses; a secret is a value with a token shape (API key, token, password, private key string), and a variable name alone is public.

**How to apply:** Keep the imperative rule in both reviewer prompts; it is reviewer-side only and needs no `skills/correctionguy/SKILL.md` sync. Do not re-add a reviewer-side secret or memory flag: a secret check is not one of the six failures ([[reviewer-six-failures]]). The agent-facing secret wording lives in `skills/setup/SKILL.md`.
