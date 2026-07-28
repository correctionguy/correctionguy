---
name: cursor-directory-never-resyncs
description: cursor.directory snapshots a plugin repo once at submission and never re-syncs; the only update lever is the owner hand-editing at /plugins/<slug>/edit
metadata:
  type: reference
---

cursor.directory is the open-source community directory, repo `cursor/community-plugins` (formerly `pontusab/directories`; GitHub redirects). All listing data lives in its Supabase database; GitHub is read exactly once, at submission time (`apps/cursor/src/lib/github-plugin/parse.ts`), and the parse result is snapshotted into `plugins` / `plugin_components`. Verified 2026-07-28 against public main commit 689fcba (pushed 2026-06-09; deployed site may have diverged).

**Why:** Owner asked why the directory listing was stale after new releases (User's Claim, 2026-07-28: correctionguy approved on Cursor Marketplace, but cursor.directory/plugins/correctionguy showed old content). The listing still carried the description "live Codex review and discipline hooks", which existed in this repo only between 2026-05-26 (c24f23a) and 2026-06-07 (8d8c1c3), dating the snapshot to that window. This is by design, not a broken CI: the repo has never had CI, and no CI could fix it anyway.

**How to apply:**

- There is no webhook, cron, API, or re-sync job that refreshes listing content (the two Vercel crons only drain/recover the security-scan queue; the scan re-clones the repo but writes only scan/flag fields, never name/description/components).
- The `plugins.version` column defaults to `'1.0.0'`, is never written by any code path, and is never rendered. The directory displays no version and no last-updated date.
- To update a listing: sign in as the plugin owner and hand-edit at `cursor.directory/plugins/<slug>/edit`. Editable: name, description, logo, homepage, keywords, components. The repository URL is locked once imported from GitHub, and there is no "re-sync from GitHub" button; component content must be re-pasted by hand.
- Editing install-relevant content sets `active = false` and re-queues the security scan, so the plugin is temporarily delisted until the scan passes. Updates are rate-limited to a few per hour per user.
- After each release that changes user-facing copy or components, the directory edit is a manual step; see [[release-process]].

Related: [[cursor-marketplace-manual-review]]
