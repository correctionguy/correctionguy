---
name: reviewer-corrections-are-imperatives
description: Reviewer additionalContext is an imperative to the agent (verb first); a tenseless caveman fragment like "send no X" reads as "sent no X" and the agent does the opposite; the secret check is a value shape, not a keyword near a path
metadata:
  type: feedback
---

Owner issue (GitHub issue 13, 2026-09-17) from sessions on 2026-09-05: a stop-check correction "Claude send no PushNotification" was meant as "do not send one" and was read as "sent none, should have". The agent sent one and the next check flagged it for disobeying the hook. Caveman style drops auxiliaries and tense, so a bare fragment carries no polarity. The same sessions saw the live monitor flag "`.memory` has private key" six times on a line that named an env var, not a value; two subagents could not reproduce a leak.

**Why:** A correction the agent can invert is worse than none: it triggers the opposite action and a second false flag. A keyword-shaped secret check flags variable names that every memory in `.memory` legitimately uses.

**How to apply:** Since v3.21.0 both reviewer prompts in `scripts/prompts.ts` require the correction to be an imperative addressed to the agent, verb first ("Do not send notification", "Run tests before claim"), never an observation whose polarity the agent must infer. Reviewer-side only; no `skills/correctionguy/SKILL.md` sync ([[reviewer-six-failures]]). The memory flag that produced the secret false positives was the v3.19.0 live monitor's "`.env` keys" wording; that reviewer flag left the prompts in v3.20.0 and is not re-added, since a secret check is not one of the six failures ([[correctionguy-scope-generic-integrity-only]]). The surviving agent-facing wording in `skills/setup/SKILL.md` names a secret as a token-shaped value (API key, token, password, private key string) and a variable name alone as public.
