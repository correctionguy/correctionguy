---
name: codex-read-only-sandbox-reads-whole-fs
description: The Codex read-only sandbox blocks writes and network, not reads; workingDirectory does not confine reads, so the stop check can read the transcript file
metadata:
  type: reference
---

Codex `sandboxMode: "read-only"` (the plugin default unless `CORRECTIONGUY_YOLO=1`) is a write and network boundary. Every non-danger mode grants whole-filesystem read, and `workingDirectory` does not confine reads: macOS Seatbelt allows `file-read*`, Linux Landlock installs read rules beneath `/`. Source: https://github.com/openai/codex/blob/main/codex-rs/linux-sandbox/src/landlock.rs

**How to apply:** The stop prompt tells the reviewer to read `transcript_path` for the full session, since the hook snapshot is truncated and may lag. The read normally succeeds; the prompt treats a denial or a missing file as best effort and leans "ok".
