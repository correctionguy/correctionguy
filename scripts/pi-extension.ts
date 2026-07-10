import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { runReview, runStopReview } from "./codex.ts";
import { MonitorCadence } from "./core.ts";
import type { HookInput } from "./core.ts";
import { runHook } from "./correctionguy.ts";
import {
  mapPiOutput,
  piBranchToTranscript,
  turnToolCalls,
} from "./pi-adapter.ts";
import { SESSION_START } from "./prompts.ts";

const CUSTOM_TYPE = "correctionguy";

const cadence = MonitorCadence.parse(
  process.env.CORRECTIONGUY_MONITOR_EVERY_BATCHES ?? 10
);

export default function correctionguy(pi: ExtensionAPI): void {
  let preludeInjected = false;
  let blockCount = 0;

  pi.on("session_start", () => {
    preludeInjected = false;
    blockCount = 0;
  });

  pi.on("input", (event) => {
    if (event.source !== "extension") {
      blockCount = 0;
    }
  });

  pi.on("before_agent_start", () => {
    if (preludeInjected) {
      return;
    }
    preludeInjected = true;
    return {
      message: {
        content: SESSION_START,
        customType: CUSTOM_TYPE,
        display: true,
      },
    };
  });

  pi.on("turn_end", async (event, ctx) => {
    if (event.toolResults.length === 0) {
      return;
    }
    const hookInput: HookInput = {
      session_id: ctx.sessionManager.getSessionId(),
      tool_calls: turnToolCalls(event.message, event.toolResults),
      transcript_path: ctx.sessionManager.getSessionFile() ?? "",
    };
    const output = await runHook("PostToolBatch", hookInput, cadence, {
      readTranscript: () =>
        Promise.resolve(piBranchToTranscript(ctx.sessionManager.getBranch())),
      review: runReview,
      stopReview: runStopReview,
    });
    const action = mapPiOutput(output, "PostToolBatch");
    if (action) {
      pi.sendMessage(
        { content: action.text, customType: CUSTOM_TYPE, display: true },
        { deliverAs: "steer" }
      );
    }
  });

  pi.on("agent_end", async (_event, ctx) => {
    const hookInput: HookInput = {
      stop_hook_active: blockCount > 0,
      transcript_path: ctx.sessionManager.getSessionFile() ?? "",
    };
    const output = await runHook("Stop", hookInput, cadence, {
      readTranscript: () =>
        Promise.resolve(piBranchToTranscript(ctx.sessionManager.getBranch())),
      review: runReview,
      stopReview: runStopReview,
    });
    const action = mapPiOutput(output, "Stop");
    if (!action) {
      blockCount = 0;
      return;
    }
    if (action.kind === "block") {
      blockCount += 1;
      pi.sendMessage(
        { content: action.text, customType: CUSTOM_TYPE, display: true },
        { deliverAs: "followUp", triggerTurn: true }
      );
      return;
    }
    blockCount = 0;
    pi.sendMessage(
      { content: action.text, customType: CUSTOM_TYPE, display: true },
      { deliverAs: "nextTurn" }
    );
    if (ctx.hasUI) {
      ctx.ui.notify(action.text, "warning");
    }
  });

  pi.registerCommand(CUSTOM_TYPE, {
    description: "Restate the Correction Guy discipline.",
    handler: () => {
      pi.sendMessage(
        { content: SESSION_START, customType: CUSTOM_TYPE, display: true },
        { deliverAs: "followUp", triggerTurn: true }
      );
      return Promise.resolve();
    },
  });
}
