---
name: session-review-breaker
description: After one failed review, PostToolBatch and Stop skip the reviewer for the rest of the session through a tmpdir marker keyed by session id; SessionStart clears it; any thrown review error trips it, classified by the throw and never by message text
metadata:
  type: project
---

Since v3.26.0 the PostToolBatch and Stop handlers in `scripts/correctionguy.ts` return before reading the transcript when a skip marker exists for the session, and write that marker when a review throws. The marker is an empty file in the OS tmpdir named by a SHA-256 of the session id, the same shape as the nudge state ([[stop-nudge-dedupe]]). The SessionStart handler removes it, so a resume, a clear, or a compaction gives the reviewer one more try. Pi injects the preamble itself and never calls the SessionStart handler, so a Pi session's marker lives until the tmpdir is cleared.

Any error the review call throws trips the breaker: a usage limit, a capacity error, an oversize context, a response that is not the JSON the schema wants, or the 120-second timeout. The classification is the throw itself, never the message text.

**Why:** Once the Codex account behind the review was over its usage limit, every stop still ran the review, cost 2 to 120 seconds, and wrote the same failure into the session: 413 occurrences across 48 sessions on one host (owner count, 2026-09-20). The tokenmaxxing pool (v3.24.0) lowers how often that happens; the breaker bounds the cost when every pooled account is out.

**How to apply:** A transient failure also silences the session until the next SessionStart; the upgrade path is classifying the SDK error by type and tripping only on the terminal ones. Keep the marker session-scoped and in tmpdir; a state directory under the home folder would outlive reboots and need its own cleanup. Keep the skip check ahead of `readTranscript`, so a skipped hook costs no transcript parse either.
