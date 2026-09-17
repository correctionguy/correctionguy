import { readdir } from "node:fs/promises";
import path from "node:path";

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
import type { HookOutput, Review, StopReview, Transcript } from "./core.ts";
import { CLAUDE_PROMPTS, SESSION_START } from "./prompts.ts";
import type { HostPrompts } from "./prompts.ts";

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
  origin: string;
}

const handlers: Record<
  Command,
  (ctx: HookContext) => Promise<HookOutput | null>
> = {
  PostToolBatch: async ({ cadence, deps, hookInput, origin }) => {
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
      const review = await deps.review(deps.prompts.liveMonitor, context);
      return liveMonitorOutput({
        ...review,
        additionalContext: `${origin}${review.additionalContext}`,
      });
    } catch (error) {
      console.error(
        `correctionguy live-monitor review failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  },

  SessionStart: () =>
    Promise.resolve(hookContextOutput("SessionStart", SESSION_START)),

  Stop: async ({ deps, hookInput, origin }) => {
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
      return stopOutput(
        {
          ...review,
          additionalContext: `${origin}${review.additionalContext}`,
        },
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
): Promise<HookOutput | null> => {
  const originId = hookInput.agent_id ?? hookInput.session_id;
  return handlers[command]({
    cadence,
    deps,
    hookInput,
    origin: originId ? `[for ${originId}] ` : "",
  });
};

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
      const { agent_id, transcript_path } = hookInput;
      if (!transcript_path) {
        throw new Error("transcript_path missing from hook input");
      }
      if (!agent_id) {
        return parseTranscript(await io.readFile(transcript_path));
      }
      const root = path.join(
        path.dirname(transcript_path),
        path.basename(transcript_path, ".jsonl"),
        "subagents"
      );
      const entries = await readdir(root, { recursive: true });
      const entry = entries.find(
        (candidate) => path.basename(candidate) === `agent-${agent_id}.jsonl`
      );
      if (!entry) {
        throw new Error(
          `subagent transcript agent-${agent_id}.jsonl missing under ${root}`
        );
      }
      return parseTranscript(await io.readFile(path.join(root, entry)));
    },
    review: io.review,
    stopReview: io.stopReview,
  });
  return output ? JSON.stringify(output) : null;
};
