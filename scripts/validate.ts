import { existsSync } from "node:fs";

import { z } from "zod/v4";

const manifests = [
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".cursor-plugin/marketplace.json",
] as const;

const procs = manifests.map((manifest) =>
  Bun.spawn(["claude", "plugin", "validate", manifest, "--strict"], {
    stderr: "inherit",
    stdout: "inherit",
  })
);
const codes = await Promise.all(procs.map((proc) => proc.exited));

let failed = codes.some((code) => code !== 0);

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

process.exit(failed ? 1 : 0);
