---
name: session-review-breaker
description: One thrown review turns PostToolBatch and Stop reviews off for the rest of the session through a tmpdir marker keyed by session id; SessionStart clears it
metadata:
  type: project
---

The `PostToolBatch` and `Stop` handlers in `scripts/correctionguy.ts` return before reading the transcript when a skip marker exists for the session, and write the marker when a review throws. The marker is an empty tmpdir file named by a SHA-256 of the session id, the same shape as the nudge state ([[stop-nudge-dedupe]]). `SessionStart` removes it, so a resume, clear, or compaction gives the reviewer one more try. Pi never calls the `SessionStart` handler, so a Pi marker lives until the tmpdir is cleared. Any thrown error trips it (usage limit, capacity, oversize context, non-JSON reply, the 120-second timeout); the classification is the throw, never the message text.

**Why:** Without it an exhausted Codex account paid the same failed review, 2 to 120 seconds, on every stop for the rest of the session.

**How to apply:** A transient failure also silences the session; the upgrade path is classifying the SDK error by type and tripping on terminal ones only. Keep the marker session-scoped in tmpdir, and keep the skip check ahead of `readTranscript`.
