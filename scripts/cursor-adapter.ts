import { HookInput, correctionguyMessage } from "./core.ts";
import type { Command, HookOutput, PostToolBatchToolCall } from "./core.ts";

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
  conversation_id?: string;
  hook_event_name?: string;
  last_assistant_message?: string;
  loop_count?: number;
  session_id?: string;
  session_title?: string;
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

  const sessionId = payload.session_id ?? payload.conversation_id;
  if (sessionId) {
    hookInput.session_id = sessionId;
  }
  if (payload.session_title) {
    hookInput.session_title = payload.session_title;
  }

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

export const mapCursorOutput = (
  output: HookOutput | null,
  command: Command
): object | null => {
  if (output === null) {
    return null;
  }

  if (command === "Stop") {
    if ("decision" in output && output.decision === "block") {
      return { followup_message: correctionguyMessage(output.reason) };
    }
    return { followup_message: output.systemMessage };
  }

  if (
    "hookSpecificOutput" in output &&
    output.hookSpecificOutput.additionalContext
  ) {
    return {
      additional_context: correctionguyMessage(
        output.hookSpecificOutput.additionalContext
      ),
    };
  }

  return null;
};
