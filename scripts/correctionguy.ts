import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { runReview, runStopReview } from "./codex.ts";
import {
  NUDGE_COOLDOWN_MS,
  NudgeState,
  correctionguyMessage,
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

export const skipStatePath = (sessionId: string) =>
  path.join(
    tmpdir(),
    `correctionguy-skipped-${createHash("sha256").update(sessionId).digest("hex")}`
  );

interface HookDeps {
  prompts: HostPrompts;
  readTranscript: () => Promise<Transcript>;
}

interface HookContext {
  cadence: number;
  deps: HookDeps;
  hookInput: HookInput;
  origin: string;
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
  PostToolBatch: async ({ cadence, deps, hookInput, origin }) => {
    if (
      hookInput.session_id &&
      existsSync(skipStatePath(hookInput.session_id))
    ) {
      return null;
    }
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
      const review = await runReview(deps.prompts.liveMonitor, context);
      return liveMonitorOutput({
        ...review,
        additionalContext: `${origin}${review.additionalContext}`,
      });
    } catch (error) {
      console.error(
        `correctionguy live-monitor review failed: ${error instanceof Error ? error.message : String(error)}`
      );
      if (hookInput.session_id) {
        await writeFile(skipStatePath(hookInput.session_id), "", {
          mode: 0o600,
        });
        console.error(
          "correctionguy: reviews skipped for the rest of this session"
        );
      }
      return null;
    }
  },

  SessionStart: async ({ hookInput }) => {
    if (hookInput.session_id) {
      await rm(skipStatePath(hookInput.session_id), { force: true });
    }
    return SESSION_START_OUTPUT;
  },

  Stop: async ({ deps, hookInput, origin }) => {
    if (
      hookInput.session_id &&
      existsSync(skipStatePath(hookInput.session_id))
    ) {
      return null;
    }
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
      const prefixed = {
        ...review,
        additionalContext: `${origin}${review.additionalContext}`,
      };
      const output = stopOutput(prefixed, hookInput.stop_hook_active ?? false);
      if (
        output === null ||
        "decision" in output ||
        prefixed.verdict !== "nudge" ||
        prefixed.additionalContext === "" ||
        !hookInput.session_id
      ) {
        return output;
      }
      const target = nudgeStatePath(hookInput.session_id);
      const state = NudgeState.parse(
        JSON.parse(existsSync(target) ? await readFile(target, "utf-8") : "{}")
      );
      const key = prefixed.additionalContext;
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
      if (hookInput.session_id) {
        await writeFile(skipStatePath(hookInput.session_id), "", {
          mode: 0o600,
        });
        console.error(
          "correctionguy: reviews skipped for the rest of this session"
        );
      }
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
