---
name: release-process
description: how to cut a release — bump 3 version manifests in lockstep, annotated tag, GitHub-only release (no npm)
metadata:
  type: project
---

Cutting a release for correctionguy (e.g. minor bump 3.0.0 -> 3.1.0):

1. Bump the version in **all three** manifests in lockstep — easy to miss two of them: `package.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json`.
2. Verify with `bun run check`, `bun run typecheck`, `bun run validate` (validate parses the manifests).
3. Commit (conventional-commits style, detailed body, **no** Co-Authored-By trailer — repo history has none).
4. `git push origin main`.
5. **Annotated** tag: `git tag -a vX.Y.Z -m "vX.Y.Z — <summary>"`, then `git push origin vX.Y.Z`. Recent tags (v2.3.0, v3.0.0) are annotated; v2.2.0 was lightweight.
6. GitHub release: `gh release create vX.Y.Z --title "vX.Y.Z" --notes "..."`.
7. If the release changed user-facing copy, keywords, or Cursor components (hooks/skills/commands): the Cursor surfaces do NOT pick this up on their own. Hand-edit the cursor.directory listing at `cursor.directory/plugins/correctionguy/edit` (owner sign-in; re-scan temporarily delists) and notify Cursor for the official marketplace re-review. See [[cursor-directory-never-resyncs]] and [[cursor-marketplace-manual-review]].

No npm publish — releases are GitHub-only (no `publish`/`prepublish` script, package not marked private). `git push` over HTTPS uses git's smart transfer protocol (https://git-scm.com/docs/http-protocol), a separate transport from the REST API, so GitHub's REST rate limit (5,000 req/hr for authenticated users — https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) only gates `gh release`/`gh api`, not `git push`. In this harness that REST budget is shared across all session tools/agents (per a harness system-reminder).

Note (2026-06-26): tag `v3.0.0` exists but has **no** GitHub release — the v3.0.0 release was skipped. v3.1.0 is the first GitHub release after v2.3.0.

Injected guidance to keep in sync when changing prompt behavior: the three strings in `scripts/prompts.ts` (SESSION_START, STOP_PROMPT, LIVE_MONITOR_PROMPT) PLUS the sibling reminders `skills/correctionguy/SKILL.md` and `commands/correctionguy.md`. Nuance: the two sibling files mirror the **agent-facing** discipline of `SESSION_START` (understand / track todos / remember-to-`.memory` / verify third-party / finish / run / review) — they carry NO reviewer ruleset. So a change confined to the **reviewer-side detection stance** in STOP_PROMPT or LIVE_MONITOR_PROMPT (a new/strengthened flag, a detection prime like the v3.2.0 "Claude just made a serious AGENTS.md violation" prior) needs NO sibling sync; there is nothing in SKILL.md/command to mirror. Sync the siblings only when the shared agent-facing guidance itself changes. (The plugin's own live monitor will still heuristically flag any prompts.ts edit as "siblings not synced" — verify against the files before acting on it.) See [[live-monitor-todos-title-sources]] and [[pi-extension-integration]].
