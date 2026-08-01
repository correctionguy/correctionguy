---
name: memories-default-to-dot-memory
description: Memories (incl. User's Claims) default to .memory; elsewhere only if a rule says so; recorded claims are sourced
metadata:
  type: feedback
---

By default, every memory — including a User's Claim (a fact the owner/user states about the project) — is recorded to the project's `.memory` folder. Put a memory somewhere else (e.g., committed dev conventions in AGENTS.md) only when a specific rule directs it there. A recorded User's Claim is sourced by the owner's statement: never flag it as unverified, and never delete it for lacking an external link.

**Why:** The user set `.memory` as the default home for all memories and wants User's Claims treated as sourced.

**How to apply:** This is now an official rule in the plugin prompts (SESSION_START, STOP_PROMPT, LIVE_MONITOR_PROMPT in `scripts/prompts.ts`, plus the skill). Default new memories/claims to `.memory`; honor any specific rule that sends a particular fact elsewhere. See [[memory-files-live-in-repo-dot-memory]].
