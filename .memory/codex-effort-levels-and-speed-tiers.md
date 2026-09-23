---
name: codex-effort-levels-and-speed-tiers
description: The codex.ts effort enum must mirror the SDK ModelReasoningEffort union; service_tier is a catalog tier id and the standard tier is the absent key
metadata:
  type: project
---

The Codex model catalog (`codex debug models`, cached at `~/.codex/models_cache.json`) advertises `supported_reasoning_levels` and `service_tiers` per model, and the CLI rejects a `service_tier` the active model does not advertise. There is no `standard` tier value: the standard tier is the key left out, which `scripts/codex.ts` does unless `CORRECTIONGUY_SERVICE_TIER` is set. `fast` is a legacy alias for the `priority` tier.

**Why:** `CORRECTIONGUY_MODEL_REASONING_EFFORT` is parsed by a `z.enum` at module load. An effort the SDK supports but the enum lacks throws at import, the hook entry point swallows it, and the plugin silently does nothing.

**How to apply:** Whenever `@openai/codex-sdk` is bumped, mirror its `ModelReasoningEffort` union in the `scripts/codex.ts` enum. Set `CORRECTIONGUY_SERVICE_TIER` to a tier id the model advertises. See [[codex-sdk-version-gates-new-models]].
