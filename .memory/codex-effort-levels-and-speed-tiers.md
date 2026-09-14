---
name: codex-effort-levels-and-speed-tiers
description: Codex catalog reasoning levels (incl. ultra) and speed tiers per model; the codex.ts effort enum and SDK type gate which ones correctionguy can pass
metadata:
  type: project
---

The Codex model catalog (`codex debug models`, cached at `~/.codex/models_cache.json`) advertises per model `supported_reasoning_levels` and `service_tiers`. As of 2026-09-07: `gpt-6-astra` supports efforts low, medium, high, xhigh, max, ultra (default medium) and advertises one speed tier, id `priority`, display name "Fast". The tier id `ultrafast` (display name "Ultrafast") exists only on `gpt-5.6-sol` in the CLI's bundled fallback catalog; no live catalog entry carries it. The CLI checks `service_tier` against the active model's advertised tiers ("not advertised as supported for model").

**Why:** "Astra Ultra Fast" in the Codex TUI means model `gpt-6-astra`, reasoning effort `ultra`, speed tier `priority` (Fast), not a single tier named ultra fast. `CORRECTIONGUY_MODEL_REASONING_EFFORT=ultra` was rejected at module load by the `z.enum` in `scripts/codex.ts` (minimal, low, medium, high, xhigh) until v3.20.0 mirrored the SDK union, and the hook entry point swallowed the error, so the plugin silently did nothing.

**How to apply:**

- The `ModelReasoningEffort` type in `@openai/codex-sdk` 0.153.4 is minimal, low, medium, high, xhigh, max, ultra, persistent. Mirror it in the `scripts/codex.ts` enum whenever the SDK is bumped so every catalog effort is settable from `CORRECTIONGUY_MODEL_REASONING_EFFORT`.
- Set `CORRECTIONGUY_SERVICE_TIER` to a tier id the model advertises (`priority` for Fast). `fast` is the legacy alias that maps to `priority`. See [[codex-standard-tier-is-absent-key]] and [[codex-sdk-version-gates-new-models]].
