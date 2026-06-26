import { runReview, runStopReview } from "./codex.ts";
import { main } from "./correctionguy.ts";
import type { HookIo } from "./correctionguy.ts";

const io: HookIo = {
  argv: Bun.argv,
  cadenceEnv: Bun.env.CORRECTIONGUY_MONITOR_EVERY_BATCHES,
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
