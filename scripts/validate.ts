import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { z } from "zod/v4";

const agentPluginsManifestSchema = z
  .object({
    $schema: z.literal(
      "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"
    ),
    author: z
      .object({
        email: z.string().optional(),
        name: z.string().optional(),
        url: z.string().optional(),
      })
      .strict()
      .optional(),
    description: z.string().optional(),
    extensions: z
      .record(z.string(), z.record(z.string(), z.unknown()))
      .optional(),
    homepage: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    license: z.string().optional(),
    name: z
      .string()
      .min(1)
      .max(64)
      .regex(/^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/u),
    repository: z.string().optional(),
    version: z.string().optional(),
  })
  .strict();

const skillNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);

const legacyManifests = [
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".cursor-plugin/marketplace.json",
] as const;

const procs = legacyManifests.map((manifest) =>
  Bun.spawn(["claude", "plugin", "validate", manifest, "--strict"], {
    stderr: "inherit",
    stdout: "inherit",
  })
);
const codes = await Promise.all(procs.map((proc) => proc.exited));

let failed = codes.some((code) => code !== 0);

const agentPluginsParsed = agentPluginsManifestSchema.safeParse(
  JSON.parse(readFileSync("plugin.json", "utf-8"))
);
if (agentPluginsParsed.success) {
  console.log("plugin.json: Agent Plugins 1.0.0 manifest ok");
} else {
  console.error("plugin.json: invalid Agent Plugins manifest");
  console.error(z.prettifyError(agentPluginsParsed.error));
  failed = true;
}

const skillsRoot = "skills";
if (existsSync(skillsRoot)) {
  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const skillMd = path.join(skillsRoot, entry.name, "SKILL.md");
    if (!existsSync(skillMd)) {
      continue;
    }
    const frontmatter = /^---\n(?<body>[\s\S]*?)\n---/u.exec(
      readFileSync(skillMd, "utf-8")
    )?.groups?.body;
    const nameLine = frontmatter
      ?.split("\n")
      .find((line) => line.startsWith("name:"));
    const skillName = nameLine
      ?.slice("name:".length)
      .trim()
      .replaceAll('"', "");
    const nameOk = skillNameSchema.safeParse(skillName);
    if (nameOk.success && skillName === entry.name) {
      console.log(`skills/${entry.name}: ok`);
      continue;
    }
    console.error(
      `skills/${entry.name}: SKILL.md name must match directory (${skillName ?? "missing"})`
    );
    failed = true;
  }
}

const { pi } = z
  .object({ pi: z.object({ extensions: z.array(z.string()) }).optional() })
  .parse(await Bun.file("package.json").json());

for (const extension of pi?.extensions ?? []) {
  if (existsSync(extension)) {
    continue;
  }
  console.error(`pi extension entry missing: ${extension}`);
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
  z
    .object({ version: z.string() })
    .parse(await Bun.file(".cursor-plugin/plugin.json").json()).version,
] as const;

if (new Set(versions).size === 1) {
  console.log(`version lockstep: ${versions[0]}`);
} else {
  console.error(`version mismatch across manifests: ${versions.join(", ")}`);
  failed = true;
}

process.exit(failed ? 1 : 0);
