import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  loadSkillsFromDir,
  parseFrontmatter,
} from "@earendil-works/pi-coding-agent";
import type { SkillFrontmatter } from "@earendil-works/pi-coding-agent";
import { z } from "zod/v4";

const AGENT_PLUGINS_SCHEMA_URL =
  "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";

const legacyManifests = [
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
] as const;

const procs = legacyManifests.map((manifest) =>
  Bun.spawn(["claude", "plugin", "validate", manifest, "--strict"], {
    stderr: "inherit",
    stdout: "inherit",
  })
);
const codes = await Promise.all(procs.map((proc) => proc.exited));

let failed = codes.some((code) => code !== 0);

const schemaResponse = await fetch(AGENT_PLUGINS_SCHEMA_URL);
const agentPluginsManifestSchema = z.fromJSONSchema(
  z
    .looseObject({ $id: z.literal(AGENT_PLUGINS_SCHEMA_URL) })
    .parse(await schemaResponse.json())
);
const agentPluginsParsed = agentPluginsManifestSchema.safeParse(
  await Bun.file("plugin.json").json()
);
if (agentPluginsParsed.success) {
  console.log("plugin.json: Agent Plugins 1.0.0 manifest ok");
} else {
  console.error("plugin.json: invalid Agent Plugins manifest");
  console.error(z.prettifyError(agentPluginsParsed.error));
  failed = true;
}

const { diagnostics, skills } = loadSkillsFromDir({
  dir: "skills",
  source: "repo",
});
for (const diagnostic of diagnostics) {
  console.error(`${diagnostic.path}: ${diagnostic.message}`);
  failed = true;
}
for (const skill of skills) {
  const dirName = path.basename(skill.baseDir);
  const { frontmatter } = parseFrontmatter<SkillFrontmatter>(
    readFileSync(skill.filePath, "utf-8")
  );
  if (frontmatter.name === dirName) {
    console.log(`skills/${dirName}: ok`);
    continue;
  }
  console.error(
    `skills/${dirName}: SKILL.md name must match directory (${frontmatter.name})`
  );
  failed = true;
}

const { pi } = z
  .object({
    pi: z.object({
      extensions: z.array(z.string()),
      skills: z.array(z.string()),
    }),
  })
  .parse(await Bun.file("package.json").json());

for (const entry of [...pi.extensions, ...pi.skills]) {
  if (existsSync(entry)) {
    continue;
  }
  console.error(`pi manifest entry missing: ${entry}`);
  failed = true;
}

const versions = [
  z.object({ version: z.string() }).parse(await Bun.file("package.json").json())
    .version,
  z.object({ version: z.string() }).parse(await Bun.file("plugin.json").json())
    .version,
  z
    .object({ version: z.string() })
    .parse(await Bun.file(".claude-plugin/plugin.json").json()).version,
] as const;

if (new Set(versions).size === 1) {
  console.log(`version lockstep: ${versions[0]}`);
} else {
  console.error(`version mismatch across manifests: ${versions.join(", ")}`);
  failed = true;
}

process.exit(failed ? 1 : 0);
