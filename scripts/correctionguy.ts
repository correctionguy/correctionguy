import {
  Command,
  HookInput,
  MonitorCadence,
  hookContextOutput,
  liveMonitorContext,
  liveMonitorOutput,
  parseTranscript,
  stopOutput,
  stopReviewContext,
} from "./core.ts";
import type { Review, StopReview, Transcript } from "./core.ts";
import { LIVE_MONITOR_PROMPT, SESSION_START, STOP_PROMPT } from "./prompts.ts";

interface HookDeps {
  readTranscript: () => Promise<Transcript>;
  review: (prompt: string, context: string) => Promise<Review>;
  stopReview: (prompt: string, context: string) => Promise<StopReview>;
}

interface HookContext {
  cadence: number;
  deps: HookDeps;
  hookInput: HookInput;
}

const handlers: Record<Command, (ctx: HookContext) => Promise<object | null>> =
  {
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
          await deps.review(LIVE_MONITOR_PROMPT, context)
        );
      } catch {
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
      });
      if (context === null) {
        return null;
      }
      try {
        return stopOutput(
          await deps.stopReview(STOP_PROMPT, context),
          hookInput.stop_hook_active ?? false
        );
      } catch {
        return null;
      }
    },
  };

export const runHook = (
  command: Command,
  hookInput: HookInput,
  cadence: number,
  deps: HookDeps
): Promise<object | null> => handlers[command]({ cadence, deps, hookInput });

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
  const cadence = MonitorCadence.parse(io.cadenceEnv ?? 3);
  const output = await runHook(command, hookInput, cadence, {
    readTranscript: async () =>
      parseTranscript(await io.readFile(hookInput.transcript_path)),
    review: io.review,
    stopReview: io.stopReview,
  });
  return output ? JSON.stringify(output) : null;
};
