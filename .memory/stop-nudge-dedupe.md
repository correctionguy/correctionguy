---
name: stop-nudge-dedupe
description: Stop nudges dedupe per session per correction text on a 30-minute cooldown, blocks never dedupe; the .memory opt-out is an instruction-file rule, never an env key or marker file
metadata:
  type: project
---

The `Stop` handler in `scripts/correctionguy.ts` holds back a nudge when the same correction text already fired in the same session inside `NUDGE_COOLDOWN_MS`. State is one JSON file per session in the OS tmpdir named by a SHA-256 of the session id, since Pi accepts session ids that are not UUIDs. A block is never held back. The reviewer still runs on every Stop; the dedupe drops the repeated output, not the review, because the correction text is the key.

The per-repo opt-out for `.memory` is a line in an instruction file the host loads; `SESSION_START` and the `/correctionguy` skill yield to it.

**Why:** A repo whose rules retire `.memory` made the layout demand unsatisfiable, and the same nudge fired on every Stop.

**How to apply:** Do not add a `CORRECTIONGUY_*` switch or a marker file for memory; point users at their instruction files. Keep the stop prompt's reply shape identical to `StopReview` in `scripts/core.ts`, or the reviewer JSON fails the schema and the stop check goes silent. On Claude Code a Stop `systemMessage` reaches the user only; on Pi the agent sees a nudge as `nextTurn`.
