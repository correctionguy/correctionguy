import { z } from "zod/v4";

import { correctionguyMessage, jsonString } from "./core.ts";
import type { Command, HookInput, HookOutput } from "./core.ts";

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

export const CursorHookPayload = z.looseObject({
  conversation_id: z.string().optional(),
  hook_event_name: z.string().optional(),
  last_assistant_message: z.string().optional(),
  loop_count: z.number().optional(),
  session_id: z.string().optional(),
  tool_input: z.json().optional(),
  tool_name: z.string().optional(),
  tool_output: z.string().optional(),
  tool_use_id: z.string().optional(),
  transcript_path: z.string().nullish(),
});
export type CursorHookPayload = z.output<typeof CursorHookPayload>;

export const mapCursorInput = (
  payload: CursorHookPayload,
  command: Command
): HookInput => {
  const transcript_path =
    payload.transcript_path ?? process.env.CURSOR_TRANSCRIPT_PATH;

  const hookInput: HookInput = {};
  if (transcript_path) {
    hookInput.transcript_path = transcript_path;
  }

  const sessionId = payload.session_id ?? payload.conversation_id;
  if (sessionId) {
    hookInput.session_id = sessionId;
  }

  if (command === "Stop") {
    hookInput.last_assistant_message = payload.last_assistant_message;
    hookInput.stop_hook_active = (payload.loop_count ?? 0) > 0;
  }

  if (command === "PostToolBatch") {
    hookInput.tool_calls = [];
    if (payload.tool_name) {
      const output =
        payload.tool_output === undefined
          ? undefined
          : jsonString(z.json()).safeParse(payload.tool_output);
      hookInput.tool_calls.push({
        tool_input: payload.tool_input,
        tool_name: payload.tool_name,
        tool_response: output?.success ? output.data : payload.tool_output,
        tool_use_id: payload.tool_use_id,
      });
    }
  }

  return hookInput;
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
