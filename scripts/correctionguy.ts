import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import {
  lstat,
  mkdir,
  readFile,
  rename,
  rm,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { runReview, runStopReview, runTasteReview } from "./codex.ts";
import {
  MAX_FIELD_CHARS,
  MonitorCadence,
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
  Taste,
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
    "Preamble loaded into context. Six failures hunted: unverified assumption, missed requirement, integration error, regression, wrong file, no reviews. Taste in .taste checked too. Full rules: correctionguy skill."
  ),
};

const handlers: Record<
  Command,
  (ctx: HookContext) => Promise<HookOutput | null>
> = {
  PostToolBatch: async ({ deps, hookInput, origin }) => {
    if (
      hookInput.session_id &&
      existsSync(skipStatePath(hookInput.session_id))
    ) {
      return null;
    }
    const { lines, records } = await deps.readTranscript();
    const context = liveMonitorContext({
      cadence: MonitorCadence.parse(
        process.env.CORRECTIONGUY_MONITOR_EVERY_BATCHES
      ),
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

  UserPromptSubmit: async ({ deps, hookInput }) => {
    if (
      !hookInput.prompt ||
      (hookInput.session_id && existsSync(skipStatePath(hookInput.session_id)))
    ) {
      return null;
    }
    const startedAt = new Date();
    let taste: Taste;
    try {
      taste = await runTasteReview(
        deps.prompts.taste,
        JSON.stringify({
          transcript_path: hookInput.transcript_path,
          user_prompt: hookInput.prompt.slice(0, MAX_FIELD_CHARS),
        })
      );
    } catch (error) {
      console.error(
        `correctionguy taste review failed: ${error instanceof Error ? error.message : String(error)}`
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
    if (taste.file === "") {
      return null;
    }
    const dir = path.join(
      process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
      ".taste"
    );
    await mkdir(dir, { recursive: true });
    const dirStats = await lstat(dir);
    if (!dirStats.isDirectory()) {
      throw new Error(`${dir} is not a directory`);
    }
    const target = path.join(dir, taste.file);
    const existing = existsSync(target) ? await lstat(target) : null;
    if (existing && existing.mtime > startedAt) {
      return null;
    }
    const staged = path.join(dir, `.${taste.file}.${randomUUID()}`);
    await writeFile(staged, taste.content, { flag: "wx" });
    await utimes(staged, startedAt, startedAt);
    await rename(staged, target);
    return null;
  },
};

export const runHook = (
  command: Command,
  hookInput: HookInput,
  deps: HookDeps
): Promise<HookOutput | null> => {
  const originId = hookInput.agent_id ?? hookInput.session_id;
  return handlers[command]({
    deps,
    hookInput,
    origin: originId ? `[for ${originId}] ` : "",
  });
};
