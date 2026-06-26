import type {
  SessionEntry,
  TurnEndEvent,
} from "@earendil-works/pi-coding-agent";

import { correctionguyMessage, parseTranscript } from "./core.ts";
import type {
  Command,
  HookOutput,
  PostToolBatchToolCall,
  Transcript,
} from "./core.ts";

type PiMessage = TurnEndEvent["message"];
type PiToolResult = TurnEndEvent["toolResults"][number];
type TranscriptBlock =
  | {
      id: string;
      input: Record<string, unknown>;
      name: string;
      type: "tool_use";
    }
  | { text: string; type: "text" };

export const piBranchToTranscript = (
  entries: readonly SessionEntry[]
): Transcript => {
  const lines: string[] = [];
  for (const entry of entries) {
    if (entry.type === "custom_message") {
      const content =
        typeof entry.content === "string"
          ? entry.content
          : entry.content.flatMap((block) =>
              block.type === "text"
                ? [{ text: block.text, type: "text" as const }]
                : []
            );
      lines.push(JSON.stringify({ message: { content }, type: "custom" }));
      continue;
    }
    if (entry.type !== "message") {
      continue;
    }
    const { message } = entry;
    if (message.role === "user") {
      const content =
        typeof message.content === "string"
          ? message.content
          : message.content.flatMap((block) =>
              block.type === "text"
                ? [{ text: block.text, type: "text" as const }]
                : []
            );
      lines.push(JSON.stringify({ message: { content }, type: "user" }));
      continue;
    }
    if (message.role === "assistant") {
      const content = message.content.flatMap<TranscriptBlock>((block) => {
        if (block.type === "text") {
          return [{ text: block.text, type: "text" }];
        }
        if (block.type === "toolCall") {
          return [
            {
              id: block.id,
              input: block.arguments,
              name: block.name,
              type: "tool_use",
            },
          ];
        }
        return [];
      });
      lines.push(JSON.stringify({ message: { content }, type: "assistant" }));
      continue;
    }
    if (message.role === "toolResult") {
      const text = message.content
        .flatMap((block) => (block.type === "text" ? [block.text] : []))
        .join("");
      lines.push(
        JSON.stringify({
          message: {
            content: [
              {
                content: text,
                tool_use_id: message.toolCallId,
                type: "tool_result",
              },
            ],
          },
          type: "toolResult",
        })
      );
    }
  }
  return parseTranscript(lines.join("\n"));
};

export const turnToolCalls = (
  message: PiMessage,
  toolResults: readonly PiToolResult[]
): PostToolBatchToolCall[] => {
  if (message.role !== "assistant") {
    return [];
  }
  return message.content.flatMap((block) => {
    if (block.type !== "toolCall") {
      return [];
    }
    const result = toolResults.find((entry) => entry.toolCallId === block.id);
    const toolResponse = result
      ? result.content
          .flatMap((part) => (part.type === "text" ? [part.text] : []))
          .join("")
      : undefined;
    return [
      {
        tool_input: block.arguments,
        tool_name: block.name,
        tool_response: toolResponse,
        tool_use_id: block.id,
      },
    ];
  });
};

export interface PiAction {
  kind: "block" | "nudge" | "steer";
  text: string;
}

export const mapPiOutput = (
  output: HookOutput | null,
  command: Command
): PiAction | null => {
  if (output === null) {
    return null;
  }
  if (command === "Stop") {
    if ("decision" in output && output.decision === "block") {
      return { kind: "block", text: correctionguyMessage(output.reason) };
    }
    if ("continue" in output) {
      return { kind: "nudge", text: output.systemMessage };
    }
    return null;
  }
  if (
    "hookSpecificOutput" in output &&
    output.hookSpecificOutput.additionalContext
  ) {
    return {
      kind: "steer",
      text: correctionguyMessage(output.hookSpecificOutput.additionalContext),
    };
  }
  return null;
};
