---
name: agent-plugins-portable-core
description: correctionguy ships Agent Plugins 1.0.0 at root plugin.json; skills are portable; Claude/Cursor manifests remain host compatibility layers
metadata:
  type: project
---

As of v3.17.0, the repo is an [Agent Plugins](https://agent-plugins.org/) 1.0.0 package:

- Root `plugin.json` declares `$schema` `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` and portable identity/metadata only (closed schema; no hooks/commands/skills paths).
- Portable components: Agent Skills under immediate children of `skills/` (already the layout). No MCP servers, so no root `mcp.json`.
- Hooks, Cursor `/cursor-setup`, Claude marketplace, and Pi `package.json#pi.extensions` are **not** portable v1 components. Keep them as host compatibility:
  - Claude Code: `.claude-plugin/plugin.json` + `hooks/hooks.json`
  - Cursor: `.cursor-plugin/plugin.json` + `commands/` + `scripts/cursor-install.ts` (plugin hooks still do not execute; see [[cursor-plugin-hooks-never-execute]])
  - Pi: `package.json` `pi.extensions` -> `scripts/pi-extension.ts`
- Do not invent a reverse-domain extension namespace (`com.*`) unless that client documents one. Cursor still uses `.cursor-plugin/`; Claude still uses `.claude-plugin/`.
- Version bumps must include root `plugin.json` with the other three manifests. `bun run validate` checks Agent Plugins shape, skill directory/name match, legacy Claude/Cursor marketplace manifests, and version lockstep. See [[release-process]].

**Why:** Agent Plugins 1.0.0 (2026-08-06) is the cross-client package for skills/MCP; converting additively keeps Claude/Cursor/Pi working while portable skills load on Agent Plugins clients.

**How to apply:** Treat root `plugin.json` + `skills/` as the portable source of truth for reusable discipline skills. Never move hooks/commands into the portable manifest. Prefer additive changes over deleting host manifests.
