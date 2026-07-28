import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod/v4";

const HookEntry = z.looseObject({ command: z.string().optional() });
const HooksFile = z.looseObject({
  hooks: z.record(z.string(), z.array(HookEntry)).default({}),
  version: z.number().default(1),
});

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const templateText = await readFile(
  path.join(repoRoot, "hooks", "cursor-hooks.json"),
  "utf-8"
);
const template = HooksFile.parse(
  // oxlint-disable-next-line no-template-curly-in-string -- literal placeholder token, matches Cursor's own plugin-root substitution
  JSON.parse(templateText.replaceAll("${CURSOR_PLUGIN_ROOT}", repoRoot))
);

const target = path.join(homedir(), ".cursor", "hooks.json");
let existing: z.output<typeof HooksFile> = { hooks: {}, version: 1 };
try {
  existing = HooksFile.parse(JSON.parse(await readFile(target, "utf-8")));
} catch (error) {
  if (!z.object({ code: z.literal("ENOENT") }).safeParse(error).success) {
    throw error;
  }
}

const merged: Record<string, z.output<typeof HookEntry>[]> = {};
for (const [event, entries] of Object.entries(existing.hooks)) {
  const kept = entries.filter(
    (entry) => !entry.command?.includes("cursor-correctionguy-hook.ts")
  );
  if (kept.length > 0) {
    merged[event] = kept;
  }
}
for (const [event, entries] of Object.entries(template.hooks)) {
  merged[event] = [...(merged[event] ?? []), ...entries];
}

await mkdir(path.dirname(target), { recursive: true });
const tmp = `${target}.correctionguy-tmp`;
await writeFile(
  tmp,
  `${JSON.stringify({ ...existing, hooks: merged }, null, 2)}\n`
);
await rename(tmp, target);

console.log(
  `correctionguy: installed ${Object.keys(template.hooks).join(", ")} hooks into ${target}`
);
console.log(
  `hook commands run from ${repoRoot}; new Cursor agent sessions pick them up automatically`
);
