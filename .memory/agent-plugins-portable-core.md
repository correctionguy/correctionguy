---
name: agent-plugins-portable-core
description: Root plugin.json is the Agent Plugins 1.0.0 manifest and a closed schema; hooks and the Pi manifest stay in host layers
metadata:
  type: project
---

Root `plugin.json` follows `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`: identity and metadata only, closed schema, no `hooks`, `commands`, or `skills` paths. Portable components are the skills under immediate children of `skills/`. Hooks and the Pi extension are not portable components: Claude Code hooks stay in `.claude-plugin/plugin.json` plus `hooks/hooks.json`, and Pi loads `package.json` `pi.extensions` and `pi.skills`.

**Why:** The portable manifest rejects unknown keys, and Agent Plugins clients load skills only.

**How to apply:** Never move hooks or commands into the portable manifest. Do not invent a reverse-domain extension namespace unless a client documents one. See [[release-process]].
