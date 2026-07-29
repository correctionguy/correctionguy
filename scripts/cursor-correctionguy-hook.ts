import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { text } from "node:stream/consumers";

import { z } from "zod/v4";

import { runReview, runStopReview } from "./codex.ts";
import { MonitorCadence, parseTranscript } from "./core.ts";
import { runHook } from "./correctionguy.ts";
import {
  CursorHookPayload,
  mapCursorInput,
  mapCursorOutput,
  parseCursorEvent,
  parsePendingCorrection,
  pendingCorrectionPath,
  steerDenyOutput,
  toCommand,
} from "./cursor-adapter.ts";
import { CURSOR_PROMPTS } from "./prompts.ts";

try {
  const event = parseCursorEvent(process.argv.at(2) ?? "");
  const payload = CursorHookPayload.parse(
    JSON.parse(await text(process.stdin))
  );

  if (event === "preToolUse") {
    if (payload.conversation_id && payload.generation_id) {
      const target = pendingCorrectionPath(payload.conversation_id);
      let raw: string | null = null;
      try {
        raw = await readFile(target, "utf-8");
      } catch (error) {
        if (!z.object({ code: z.literal("ENOENT") }).safeParse(error).success) {
          throw error;
        }
      }
      if (raw !== null) {
        try {
          await unlink(target);
        } catch (error) {
          if (
            !z.object({ code: z.literal("ENOENT") }).safeParse(error).success
          ) {
            throw error;
          }
        }
        const pending = parsePendingCorrection.safeParse(raw);
        if (
          pending.success &&
          pending.data.generation_id === payload.generation_id
        ) {
          console.log(JSON.stringify(steerDenyOutput(pending.data.message)));
        }
      }
    }
    process.exit(0);
  }

  const command = toCommand(event);
  const hookInput = mapCursorInput(payload, command);
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
    prompts: CURSOR_PROMPTS,
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
  if (
    command === "PostToolBatch" &&
    output !== null &&
    "hookSpecificOutput" in output &&
    output.hookSpecificOutput.additionalContext &&
    payload.conversation_id &&
    payload.generation_id
  ) {
    try {
      const target = pendingCorrectionPath(payload.conversation_id);
      const tmp = `${target}.${process.pid}.tmp`;
      await writeFile(
        tmp,
        JSON.stringify({
          generation_id: payload.generation_id,
          message: output.hookSpecificOutput.additionalContext,
        }),
        { mode: 0o600 }
      );
      await rename(tmp, target);
    } catch (error) {
      console.error(
        `correctionguy steer staging failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
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
  process.exit(0);
}
