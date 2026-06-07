const manifests = [
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".cursor-plugin/marketplace.json",
] as const;

let failed = false;

for (const manifest of manifests) {
  const proc = Bun.spawn(
    ["claude", "plugin", "validate", manifest, "--strict"],
    {
      stderr: "inherit",
      stdout: "inherit",
    }
  );
  if ((await proc.exited) !== 0) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
