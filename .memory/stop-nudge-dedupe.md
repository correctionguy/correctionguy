---
name: stop-nudge-dedupe
description: Stop nudges dedupe per session per failure on a 30-minute cooldown, blocks never dedupe; the .memory opt-out is an instruction-file rule, never an env key or marker file
metadata:
  type: project
---

Since v3.21.0 the Stop handler in `scripts/correctionguy.ts` holds back a non-blocking notice when the same failure already fired in the same session inside `NUDGE_COOLDOWN_MS` (30 minutes). The key is the `failure` field the stop reviewer returns (one of the six names, null for ok, see [[reviewer-six-failures]]). State is one JSON file per session in the OS tmpdir, named by a SHA-256 of the session id, because Pi accepts caller-supplied session ids that are not UUIDs. A `block` verdict is never held back. A notice with a null `failure` or no session id fires as before.

The reviewer still runs on every Stop. Dedupe drops the repeated output, not the review, since the verdict is what supplies the key. A skip on an unchanged transcript tail was considered and left out: every Stop follows a new user or assistant line, so the tail never repeats between two Stop events.

The per-repo opt-out for `.memory` is a line in an instruction file the host loads, which SESSION_START and the `/correctionguy` skill yield to. An env key was rejected because Cursor launches hooks without the user's shell env ([[cursor-hook-messages-queue-not-steer]]), and a marker file would duplicate what instruction files already do ([[correctionguy-scope-generic-integrity-only]]).

**Why:** A repo whose rules retire `.memory` made the layout demand unsatisfiable, so the same nudge fired on every Stop: 134 times in one 22-hour session and 647 times across 69 sessions on one host under v3.19.0 (owner count, issue 11).

**How to apply:** Do not add a `CORRECTIONGUY_*` switch or a marker file for memory; point the user at their instruction files. Keep the `StopFailure` enum in `scripts/core.ts` and the six names in the stop prompt's reply line identical, or the reviewer's JSON fails the schema and the stop check goes silent. On Claude Code a Stop `systemMessage` reaches the user only; the agent sees a Stop notice only on Cursor (`followup_message`) and Pi (`nextTurn`), per https://code.claude.com/docs/en/hooks.
