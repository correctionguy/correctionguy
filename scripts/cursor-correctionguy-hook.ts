import { readFile } from "node:fs/promises";
import { text } from "node:stream/consumers";

import { runReview, runStopReview } from "./codex.ts";
import { MonitorCadence, parseTranscript } from "./core.ts";
import { runHook } from "./correctionguy.ts";
import {
  CursorHookPayload,
  mapCursorInput,
  mapCursorOutput,
  parseCursorEvent,
  toCommand,
} from "./cursor-adapter.ts";

try {
  const event = parseCursorEvent(process.argv.at(2) ?? "");
  const command = toCommand(event);
  const hookInput = mapCursorInput(
    CursorHookPayload.parse(JSON.parse(await text(process.stdin))),
    command
  );
  const transcriptPath = hookInput.transcript_path;
  if (command !== "SessionStart" && !transcriptPath) {
    console.error(
      "correctionguy: Cursor provided no transcript for this session; skipping review"
    );
    process.exit(0);
  }
  const cadence = MonitorCadence.parse(
    process.env.CORRECTIONGUY_MONITOR_EVERY_BATCHES ?? 10
  );

  const output = await runHook(command, hookInput, cadence, {
    readTranscript: async () => {
      if (!transcriptPath) {
        throw new Error("transcript_path missing from hook input");
      }
      return parseTranscript(await readFile(transcriptPath, "utf-8"));
    },
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
