import { runReview, runStopReview } from "./codex.ts";
import {
  hookContextOutput,
  liveMonitorContext,
  liveMonitorOutput,
  stopOutput,
  stopReviewContext,
} from "./core.ts";
import type { Command, HookInput, HookOutput, Transcript } from "./core.ts";
import { SESSION_START } from "./prompts.ts";
import type { HostPrompts } from "./prompts.ts";

interface HookDeps {
  prompts: HostPrompts;
  readTranscript: () => Promise<Transcript>;
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
        await runReview(deps.prompts.liveMonitor, context)
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
      return stopOutput(
        await runStopReview(deps.prompts.stop, context),
        hookInput.stop_hook_active ?? false
      );
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
