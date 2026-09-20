import { rename, rm, writeFile } from "node:fs/promises";

import { MonitorCadence, parseTranscript } from "./core.ts";
import { runHook } from "./correctionguy.ts";
import {
  CursorHookEventSchema,
  CursorHookPayloadSchema,
  mapCursorInput,
  mapCursorOutput,
  parsePendingCorrection,
  pendingCorrectionPath,
  steerDenyOutput,
  toCommand,
} from "./cursor-adapter.ts";
import { CURSOR_PROMPTS } from "./prompts.ts";

try {
  const event = CursorHookEventSchema.parse(Bun.argv.at(2));
  const payload = CursorHookPayloadSchema.parse(await Bun.stdin.json());

  if (event === "preToolUse") {
    if (payload.conversation_id && payload.generation_id) {
      const target = pendingCorrectionPath(payload.conversation_id);
      const file = Bun.file(target);
      if (await file.exists()) {
        const raw = await file.text();
        await rm(target, { force: true });
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
    Bun.env.CORRECTIONGUY_MONITOR_EVERY_BATCHES ?? 10
  );

  const output = await runHook(command, hookInput, cadence, {
    prompts: CURSOR_PROMPTS,
    readTranscript: async () => {
      if (!transcriptPath) {
        throw new Error("transcript_path missing from hook input");
      }
      return parseTranscript(await Bun.file(transcriptPath).text());
    },
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
  console.error(
    `correctionguy hook error: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(0);
}
