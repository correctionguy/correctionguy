import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { z } from "zod/v4";

import { runReview, runStopReview } from "./codex.ts";
import {
  NUDGE_COOLDOWN_MS,
  NudgeState,
  correctionguyMessage,
  jsonString,
  liveMonitorContext,
  liveMonitorOutput,
  stopOutput,
  stopReviewContext,
} from "./core.ts";
import type {
  Command,
  ContextOutput,
  HookInput,
  HookOutput,
  Transcript,
} from "./core.ts";
import { SESSION_START } from "./prompts.ts";
import type { HostPrompts } from "./prompts.ts";

export const nudgeStatePath = (sessionId: string) =>
  path.join(
    tmpdir(),
    `correctionguy-nudges-${createHash("sha256").update(sessionId).digest("hex")}.json`
  );

interface HookDeps {
  prompts: HostPrompts;
  readTranscript: () => Promise<Transcript>;
}

interface HookContext {
  cadence: number;
  deps: HookDeps;
  hookInput: HookInput;
}

const SESSION_START_OUTPUT: ContextOutput = {
  hookSpecificOutput: {
    additionalContext: SESSION_START,
    hookEventName: "SessionStart",
  },
  systemMessage: correctionguyMessage(
    "Preamble loaded into context. Six failures hunted: unverified assumption, missed requirement, integration error, regression, wrong file, no reviews. Full rules: correctionguy skill."
  ),
};

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

  SessionStart: () => Promise.resolve(SESSION_START_OUTPUT),

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
      const review = await runStopReview(deps.prompts.stop, context);
      const output = stopOutput(review, hookInput.stop_hook_active ?? false);
      if (
        output === null ||
        "decision" in output ||
        review.verdict !== "nudge" ||
        review.additionalContext === "" ||
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
      const key = review.additionalContext;
      const last = state[key];
      const now = Date.now();
      if (last !== undefined && now - last < NUDGE_COOLDOWN_MS) {
        return null;
      }
      await writeFile(target, JSON.stringify({ ...state, [key]: now }), {
        mode: 0o600,
      });
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
