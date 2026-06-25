import { tmpdir } from "node:os";
import { join } from "node:path";

import { runReview, runStopReview } from "./codex.ts";
import { main } from "./correctionguy.ts";
import type { HookIo } from "./correctionguy.ts";

const io: HookIo = {
  argv: Bun.argv,
  cadenceEnv: Bun.env.CORRECTIONGUY_MONITOR_EVERY_BATCHES,
  loadTitle: async (sessionId) => {
    const file = Bun.file(join(tmpdir(), `correctionguy-title-${sessionId}`));
    if (!(await file.exists())) {
      return null;
    }
    const contents = await file.text();
    const text = contents.trim();
    return text.length > 0 ? text : null;
  },
  persistTitle: async (sessionId, title) => {
    await Bun.write(join(tmpdir(), `correctionguy-title-${sessionId}`), title);
  },
  readFile: (path) => Bun.file(path).text(),
  readStdin: () => Bun.stdin.json(),
  review: runReview,
  stopReview: runStopReview,
};

try {
  const line = await main(io);
  if (line !== null) {
    console.log(line);
  }
} catch (error) {
  if (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    process.exit(0);
  }
  console.error(
    `correctionguy hook error: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
}
