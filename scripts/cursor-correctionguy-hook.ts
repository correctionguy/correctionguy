import { runReview, runStopReview } from "./codex.ts";
import { MonitorCadence, parseTranscript } from "./core.ts";
import { runHook } from "./correctionguy.ts";
import {
  mapCursorInput,
  mapCursorOutput,
  parseCursorEvent,
  toCommand,
} from "./cursor-adapter.ts";

try {
  const event = parseCursorEvent(Bun.argv.at(2) ?? "");
  const command = toCommand(event);
  const hookInput = mapCursorInput(
    (await Bun.stdin.json()) as Parameters<typeof mapCursorInput>[0],
    command
  );
  const cadence = MonitorCadence.parse(
    Bun.env.CORRECTIONGUY_MONITOR_EVERY_BATCHES ?? 3
  );

  const output = await runHook(command, hookInput, cadence, {
    readTranscript: async () =>
      parseTranscript(await Bun.file(hookInput.transcript_path).text()),
    review: runReview,
    stopReview: runStopReview,
  });

  const cursorOutput = mapCursorOutput(output, command);
  if (cursorOutput !== null) {
    console.log(JSON.stringify(cursorOutput));
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
