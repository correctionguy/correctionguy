import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { MonitorCadence } from "./core.ts";
import type { HookInput } from "./core.ts";
import { runHook } from "./correctionguy.ts";
import { piBranchToTranscript, turnToolCalls } from "./pi-adapter.ts";
import { PI_PROMPTS, SESSION_START } from "./prompts.ts";

process.env.CORRECTIONGUY_TOKENMAXXING ??= "0";

const CUSTOM_TYPE = "correctionguy";

const cadence = MonitorCadence.parse(
  process.env.CORRECTIONGUY_MONITOR_EVERY_BATCHES
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
    };
    const output = await runHook("PostToolBatch", hookInput, cadence, {
      prompts: PI_PROMPTS,
      readTranscript: () =>
        Promise.resolve(piBranchToTranscript(ctx.sessionManager.getBranch())),
    });
    if (output) {
      pi.sendMessage(
        {
          content: output.systemMessage,
          customType: CUSTOM_TYPE,
          display: true,
        },
        { deliverAs: "steer" }
      );
    }
  });

  pi.on("agent_end", async (_event, ctx) => {
    const hookInput: HookInput = {
      session_id: ctx.sessionManager.getSessionId(),
      stop_hook_active: blockCount > 0,
      transcript_path: ctx.sessionManager.getSessionFile(),
    };
    const output = await runHook("Stop", hookInput, cadence, {
      prompts: PI_PROMPTS,
      readTranscript: () =>
        Promise.resolve(piBranchToTranscript(ctx.sessionManager.getBranch())),
    });
    if (!output) {
      blockCount = 0;
      return;
    }
    if ("decision" in output) {
      blockCount += 1;
      pi.sendMessage(
        {
          content: output.systemMessage,
          customType: CUSTOM_TYPE,
          display: true,
        },
        { deliverAs: "followUp", triggerTurn: true }
      );
      return;
    }
    blockCount = 0;
    pi.sendMessage(
      { content: output.systemMessage, customType: CUSTOM_TYPE, display: true },
      { deliverAs: "nextTurn" }
    );
    if (ctx.hasUI) {
      ctx.ui.notify(output.systemMessage, "warning");
    }
  });
}
