---
name: codex-standard-tier-is-absent-key
description: 'Codex service_tier has no "standard" value — standard tier = omit the key; built-ins are only flex/fast'
metadata:
  node_type: memory
  type: project
  originSessionId: 7c898477-3e6e-4690-b746-bceb078e6bb6
---

Codex CLI's `service_tier` config accepts only `flex`, `fast` (legacy, maps to `priority`), and catalog tier IDs — there is no `"standard"` value. To run on the standard tier, omit the key entirely. correctionguy therefore leaves `service_tier` out of the Codex config unless `CORRECTIONGUY_SERVICE_TIER` is set (scripts/codex.ts, since v3.5.0). Verified 2026-07-10 against https://learn.chatgpt.com/docs/config-file/config-reference. Related: [[release-process]].
