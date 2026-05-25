import { HookInput, correctionguyMessage } from "./core.ts";
import type { Command, PostToolBatchToolCall } from "./core.ts";

const CURSOR_EVENTS = {
  postToolUse: "PostToolBatch",
  sessionStart: "SessionStart",
  stop: "Stop",
} as const satisfies Record<string, Command>;

export type CursorHookEvent = keyof typeof CURSOR_EVENTS;

export const parseCursorEvent = (value: string): CursorHookEvent => {
  if (value in CURSOR_EVENTS) {
    return value as CursorHookEvent;
  }
  throw new Error(`unsupported Cursor hook event: ${value}`);
};

export const toCommand = (event: CursorHookEvent): Command =>
  CURSOR_EVENTS[event];

interface CursorHookPayload {
  hook_event_name?: string;
  last_assistant_message?: string;
  loop_count?: number;
  tool_input?: unknown;
  tool_name?: string;
  tool_output?: string;
  tool_use_id?: string;
  transcript_path?: string | null;
}

export const mapCursorInput = (
  payload: CursorHookPayload,
  command: Command
): HookInput => {
  const transcript_path =
    payload.transcript_path ?? process.env.CURSOR_TRANSCRIPT_PATH ?? null;

  if (!transcript_path) {
    throw new Error("transcript_path missing from hook input and environment");
  }

  const hookInput: HookInput = { transcript_path };

  if (command === "Stop") {
    hookInput.last_assistant_message = payload.last_assistant_message;
    hookInput.stop_hook_active = (payload.loop_count ?? 0) > 0;
  }

  if (command === "PostToolBatch") {
    if (payload.tool_name) {
      let toolResponse: unknown;
      if (payload.tool_output !== undefined) {
        try {
          toolResponse = JSON.parse(payload.tool_output) as unknown;
        } catch {
          toolResponse = payload.tool_output;
        }
      }
      hookInput.tool_calls = [
        {
          tool_input: payload.tool_input,
          tool_name: payload.tool_name,
          tool_response: toolResponse,
          tool_use_id: payload.tool_use_id,
        } as PostToolBatchToolCall,
      ];
    } else {
      hookInput.tool_calls = [];
    }
  }

  return HookInput.parse(hookInput);
};

interface ClaudeHookOutput {
  continue?: boolean;
  decision?: "block";
  hookSpecificOutput?: {
    additionalContext?: string;
    hookEventName?: string;
    permissionDecision?: "deny";
    permissionDecisionReason?: string;
  };
  reason?: string;
  systemMessage?: string;
}

export const mapCursorOutput = (
  output: object | null,
  command: Command
): object | null => {
  if (output === null) {
    return null;
  }

  const hook = output as ClaudeHookOutput;
  const specific = hook.hookSpecificOutput;

  if (specific?.permissionDecision === "deny") {
    const reason =
      specific.permissionDecisionReason ??
      hook.systemMessage ??
      "Blocked by Correction Guy.";
    return {
      agent_message: reason,
      permission: "deny",
      user_message: correctionguyMessage(reason),
    };
  }

  if (command === "Stop") {
    if (hook.decision === "block" && hook.reason) {
      return { followup_message: correctionguyMessage(hook.reason) };
    }
    if (hook.systemMessage) {
      return { followup_message: hook.systemMessage };
    }
    return null;
  }

  const context = specific?.additionalContext;
  if (!context) {
    return null;
  }

  const message = correctionguyMessage(context);

  if (command === "SessionStart" || command === "PostToolBatch") {
    return { additional_context: message };
  }

  return null;
};
