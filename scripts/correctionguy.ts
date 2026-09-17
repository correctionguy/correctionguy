import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { z } from "zod/v4";

import {
  Command,
  HookInput,
  MonitorCadence,
  NUDGE_COOLDOWN_MS,
  NudgeState,
  hookContextOutput,
  jsonString,
  liveMonitorContext,
  liveMonitorOutput,
  parseTranscript,
  stopOutput,
  stopReviewContext,
} from "./core.ts";
import type { HookOutput, Review, StopReview, Transcript } from "./core.ts";
import { CLAUDE_PROMPTS, SESSION_START } from "./prompts.ts";
import type { HostPrompts } from "./prompts.ts";

export const nudgeStatePath = (sessionId: string) =>
  path.join(
    tmpdir(),
    `correctionguy-nudges-${createHash("sha256").update(sessionId).digest("hex")}.json`
  );

interface HookDeps {
  prompts: HostPrompts;
  readTranscript: () => Promise<Transcript>;
  review: (prompt: string, context: string) => Promise<Review>;
  stopReview: (prompt: string, context: string) => Promise<StopReview>;
}

interface HookContext {
  cadence: number;
  deps: HookDeps;
  hookInput: HookInput;
}

const handlers: Record<
  Command,
  (ctx: HookContext) => Promise<HookOutput | null>
> = {
  PostToolBatch: async ({ cadence, deps, hookInput }) => {
    const { lines, records } = await deps.readTranscript();
    const context = liveMonitorContext({
      cadence,
      lines,
      records,
      toolCalls: hookInput.tool_calls ?? [],
    });
    if (context === null) {
      return null;
    }
    try {
      return liveMonitorOutput(
        await deps.review(deps.prompts.liveMonitor, context)
      );
    } catch (error) {
      console.error(
        `correctionguy live-monitor review failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  },

  SessionStart: () =>
    Promise.resolve(hookContextOutput("SessionStart", SESSION_START)),

  Stop: async ({ deps, hookInput }) => {
    const { lines, records } = await deps.readTranscript();
    const context = stopReviewContext({
      lastAssistantMessage: hookInput.last_assistant_message,
      lines,
      records,
      transcriptPath: hookInput.transcript_path,
    });
    if (context === null) {
      return null;
    }
    try {
      const review = await deps.stopReview(deps.prompts.stop, context);
      const output = stopOutput(review, hookInput.stop_hook_active ?? false);
      if (
        output === null ||
        "decision" in output ||
        review.failure === null ||
        !hookInput.session_id
      ) {
        return output;
      }
      const target = nudgeStatePath(hookInput.session_id);
      let raw = "{}";
      try {
        raw = await readFile(target, "utf-8");
      } catch (error) {
        if (!z.object({ code: z.literal("ENOENT") }).safeParse(error).success) {
          throw error;
        }
      }
      const stored = jsonString(NudgeState).safeParse(raw);
      const state = stored.success ? stored.data : {};
      const last = state[review.failure];
      const now = Date.now();
      if (last !== undefined && now - last < NUDGE_COOLDOWN_MS) {
        return null;
      }
      await writeFile(
        target,
        JSON.stringify({ ...state, [review.failure]: now }),
        { mode: 0o600 }
      );
      return output;
    } catch (error) {
      console.error(
        `correctionguy stop review failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  },
};

export const runHook = (
  command: Command,
  hookInput: HookInput,
  cadence: number,
  deps: HookDeps
): Promise<HookOutput | null> =>
  handlers[command]({ cadence, deps, hookInput });

export interface HookIo {
  argv: readonly string[];
  cadenceEnv: string | undefined;
  readFile: (path: string) => Promise<string>;
  readStdin: () => Promise<unknown>;
  review: (prompt: string, context: string) => Promise<Review>;
  stopReview: (prompt: string, context: string) => Promise<StopReview>;
}

export const main = async (io: HookIo): Promise<string | null> => {
  const command = Command.parse(io.argv.at(2));
  const hookInput = HookInput.parse(await io.readStdin());
  const cadence = MonitorCadence.parse(io.cadenceEnv ?? 10);
  const output = await runHook(command, hookInput, cadence, {
    prompts: CLAUDE_PROMPTS,
    readTranscript: async () => {
      const transcriptPath = hookInput.transcript_path;
      if (!transcriptPath) {
        throw new Error("transcript_path missing from hook input");
      }
      return parseTranscript(await io.readFile(transcriptPath));
    },
    review: io.review,
    stopReview: io.stopReview,
  });
  return output ? JSON.stringify(output) : null;
};
