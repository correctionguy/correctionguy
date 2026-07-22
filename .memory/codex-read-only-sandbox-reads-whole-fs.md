---
name: codex-read-only-sandbox-reads-whole-fs
description: "Codex read-only sandbox can read the whole filesystem, not just the workspace — justifies Correction Guy's stop check reading the session transcript file"
metadata:
  node_type: memory
  type: reference
  originSessionId: 8b67b7ed-f10c-4c66-99b5-e963ab140be9
---

OpenAI Codex's `sandboxMode: "read-only"` (the mode Correction Guy uses by default in `scripts/codex.ts`, unless `CORRECTIONGUY_YOLO=1`) is a **write/network** boundary, not a read boundary. All non-danger modes grant whole-filesystem READ; `workingDirectory` does **not** confine reads. So a Codex review thread can read `~/.claude/projects/<slug>/<uuid>.jsonl` even though it lives outside the project dir.

Proof in openai/codex (`codex-rs/`): macOS Seatbelt emits `(allow file-read*)` when `has_full_disk_read_access()`; Linux Landlock installs `path_beneath_rules(["/"], access_ro)`. read-only = read whole FS, no writes/network/exec; workspace-write adds only scoped writes; danger-full-access adds writes + network.

Source: https://github.com/openai/codex/blob/main/codex-rs/linux-sandbox/src/landlock.rs

This is why `STOP_PROMPT` can tell Codex to read `transcript_path` directly to recover the real session state (the Stop-hook snapshot is truncated/may lag). The read normally succeeds; denial is the edge case (custom deny rule / absent field), so the prompt treats it as best-effort with a lean-"ok" fallback.
