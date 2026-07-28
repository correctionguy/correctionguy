---
name: cursor-marketplace-manual-review
description: Official cursor.com Marketplace never auto-updates from source; every update is manually reviewed by Cursor, with no publish CLI or API
metadata:
  type: reference
---

The official Cursor Marketplace (cursor.com/marketplace, separate system from cursor.directory) does not track plugin git repos. Per cursor.com/help/security-and-privacy/marketplace-security: "Plugins in the marketplace are not automatically updated from source code. We manually review every plugin update, so nothing gets into the marketplace without explicit approval." CursorStaff confirmed on forum.cursor.com/t/166454: "Publishing a new release does not update the official Marketplace plugin right away." Verified 2026-07-28.

**Why:** Pushing a tag or bumping `.cursor-plugin/plugin.json` does nothing on the marketplace side; expecting a release to propagate (or building CI to make it propagate) is a dead end. There is no publish CLI, API, or dashboard publish step; submission is a web form at cursor.com/marketplace/publish, and the plugin-template docs route submissions to the Cursor team via Slack or email (kniparko@anysphere.com).

**How to apply:**

- Once Cursor publishes a reviewed update, clients pick it up automatically on window focus / periodic refresh; installs are pinned to a commit SHA internally and swap atomically (forum.cursor.com/t/157274, CursorStaff).
- `/add-plugin <github-url>` installs (not via marketplace) are pinned to the commit at add time and do not update; known bug per CursorStaff.
- Team marketplaces are a different surface: they DO auto-refresh from GitHub pushes via the Cursor GitHub App (reindex at most every 10 min).
- The `version` field in `.cursor-plugin/plugin.json` is optional display metadata with no documented functional role; only `name` is required (schema: github.com/cursor/plugins `schemas/plugin.schema.json`).
- Unknown as of 2026-07-28: the exact trigger for an update review (re-submission vs Cursor re-pulling on its own cadence). As of 2026-07-28, cursor.com/marketplace/correctionguy and /marketplace/correctionguy/correctionguy both 404 and the marketplace index does not list correctionguy, so the approval may not correspond to a live official-marketplace page yet.

Related: [[cursor-directory-never-resyncs]], [[release-process]]
