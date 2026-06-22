import { compact, takeRight } from "es-toolkit";
import { z } from "zod/v4";

export const jsonString = <T extends z.ZodType>(schema: T) =>
  z
    .string()
    .transform((text, ctx) => {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        ctx.addIssue("Invalid JSON");
        return z.NEVER;
      }
    })
    .pipe(schema);

const TranscriptContentBlock = z.looseObject({ type: z.string() });
const TranscriptContent = z.union([
  z.array(TranscriptContentBlock),
  z.string().transform((text) => [{ text, type: "text" }]),
]);
const TranscriptMessage = z.looseObject({ content: TranscriptContent });
const TranscriptRecord = z.looseObject({
  message: TranscriptMessage.optional(),
  type: z.string(),
});
export type TranscriptRecord = z.output<typeof TranscriptRecord>;

const TranscriptLine = jsonString(TranscriptRecord);
export interface Transcript {
  lines: string[];
  records: TranscriptRecord[];
}

const TextContentBlock = TranscriptContentBlock.extend({
  text: z.string(),
  type: z.literal("text"),
});

export const parseTranscript = (text: string): Transcript => {
  const lines = text.trim().split("\n").filter(Boolean);
  const records = z.array(TranscriptLine).parse(lines);
  return { lines, records };
};

export const Command = z.enum(["SessionStart", "PostToolBatch", "Stop"]);
export type Command = z.output<typeof Command>;

const PostToolBatchToolCall = z.object({
  tool_input: z.json().optional(),
  tool_name: z.string(),
  tool_response: z.json().optional(),
  tool_use_id: z.string().optional(),
});
export type PostToolBatchToolCall = z.output<typeof PostToolBatchToolCall>;

export const HookInput = z.object({
  last_assistant_message: z.string().optional(),
  stop_hook_active: z.boolean().optional(),
  tool_calls: z.array(PostToolBatchToolCall).optional(),
  transcript_path: z.string(),
});
export type HookInput = z.output<typeof HookInput>;

export const MonitorCadence = z.coerce.number().pipe(z.int().min(0));

export const Review = z.object({
  additionalContext: z.string(),
  lgtm: z.boolean(),
});
export type Review = z.output<typeof Review>;

export const StopReview = z.object({
  additionalContext: z.string(),
  verdict: z.enum(["ok", "nudge", "block"]),
});
export type StopReview = z.output<typeof StopReview>;

const LiveMonitorContext = z.object({
  current_tool_batch: z.array(PostToolBatchToolCall),
  latest_assistant_message: z.string(),
  recent_transcript: z.string(),
});
const StopContext = z.object({
  last_assistant_message: z.string().optional(),
  last_user_request: z.string().optional(),
  transcript: z.string(),
  transcript_path: z.string().optional(),
});

const RECENT_TRANSCRIPT_LINES = 60;
const STOP_TRANSCRIPT_LINES = 120;
const MAX_CONTEXT_CHARS = 100_000;
const MAX_FIELD_CHARS = 32_000;
export const correctionguyMessage = (message: string) =>
  `(Correction Guy) ${message.trim()}`;

type ContextHookEvent = "SessionStart" | "PostToolBatch";

export const hookContextOutput = (
  hookEventName: ContextHookEvent,
  additionalContext: string
) => ({
  hookSpecificOutput: { additionalContext, hookEventName },
  systemMessage: correctionguyMessage(additionalContext),
});

const TRUNCATED_PREFIX = "[earlier review context truncated to fit the model]";

export const liveMonitorContext = (input: {
  cadence: number;
  lines: string[];
  records: TranscriptRecord[];
  toolCalls: PostToolBatchToolCall[];
}): string | null => {
  const { cadence, lines, records, toolCalls } = input;
  let batchCount = records.filter(
    (r) =>
      r.type === "user" &&
      (r.message?.content ?? []).some(
        (b) =>
          typeof b === "object" &&
          b !== null &&
          "type" in b &&
          (b as { type: string }).type === "tool_result"
      )
  ).length;
  if (toolCalls.length) {
    const lastUser = records.findLast((r) => r.type === "user");
    const flushed = lastUser
      ? (lastUser.message?.content ?? []).filter(
          (b) =>
            typeof b === "object" &&
            b !== null &&
            "type" in b &&
            (b as { type: string }).type === "tool_result"
        ).length
      : 0;
    if (flushed < toolCalls.length) {
      batchCount += 1;
    }
  }
  if (!(batchCount > 0 && cadence > 0 && batchCount % cadence === 0)) {
    return null;
  }

  let latestAssistant = "";
  for (const record of records.toReversed()) {
    if (record.type !== "assistant") {
      continue;
    }
    const text = (record.message?.content ?? [])
      .flatMap((block) => {
        const parsed = TextContentBlock.safeParse(block);
        return parsed.success ? [parsed.data.text] : [];
      })
      .join("\n")
      .trim();
    if (text) {
      latestAssistant = text;
      break;
    }
  }

  const serialized = JSON.stringify(
    LiveMonitorContext.parse({
      current_tool_batch: toolCalls,
      latest_assistant_message: latestAssistant,
      recent_transcript: takeRight(lines, RECENT_TRANSCRIPT_LINES).join("\n"),
    })
  );
  return serialized.length <= MAX_CONTEXT_CHARS
    ? serialized
    : `${TRUNCATED_PREFIX}\n${serialized.slice(-MAX_CONTEXT_CHARS)}`;
};

export const liveMonitorOutput = (review: Review) =>
  review.lgtm
    ? null
    : hookContextOutput("PostToolBatch", review.additionalContext);

export const stopReviewContext = (input: {
  lastAssistantMessage?: string;
  lines: string[];
  records: TranscriptRecord[];
  transcriptPath?: string;
}): string | null => {
  let transcript = takeRight(input.lines, STOP_TRANSCRIPT_LINES).join("\n");

  let extractedAssistant = "";
  for (const record of input.records.toReversed()) {
    if (record.type !== "assistant") {
      continue;
    }
    const text = (record.message?.content ?? [])
      .flatMap((block) => {
        const parsed = TextContentBlock.safeParse(block);
        return parsed.success ? [parsed.data.text] : [];
      })
      .join("\n")
      .trim();
    if (text) {
      extractedAssistant = text.slice(-MAX_FIELD_CHARS);
      break;
    }
  }

  let extractedUser = "";
  for (const record of input.records.toReversed()) {
    if (record.type !== "user") {
      continue;
    }
    const text = (record.message?.content ?? [])
      .flatMap((block) => {
        const parsed = TextContentBlock.safeParse(block);
        return parsed.success ? [parsed.data.text] : [];
      })
      .join("\n")
      .trim();
    if (text) {
      extractedUser = text.slice(0, MAX_FIELD_CHARS);
      break;
    }
  }

  const lastAssistantMessage =
    extractedAssistant || input.lastAssistantMessage?.slice(-MAX_FIELD_CHARS);
  const lastUserRequest = extractedUser || undefined;

  if (
    compact([transcript, lastAssistantMessage, lastUserRequest]).length === 0
  ) {
    return null;
  }

  let serialized = JSON.stringify(
    StopContext.parse({
      last_assistant_message: lastAssistantMessage,
      last_user_request: lastUserRequest,
      transcript,
      transcript_path: input.transcriptPath,
    })
  );
  let attempts = 0;
  while (
    serialized.length > MAX_CONTEXT_CHARS &&
    transcript.length > 0 &&
    attempts < 6
  ) {
    const overshoot = serialized.length - MAX_CONTEXT_CHARS;
    const newLen = Math.max(0, transcript.length - overshoot - 256);
    transcript =
      newLen > 0
        ? `${TRUNCATED_PREFIX}\n${transcript.slice(-newLen)}`
        : TRUNCATED_PREFIX;
    serialized = JSON.stringify(
      StopContext.parse({
        last_assistant_message: lastAssistantMessage,
        last_user_request: lastUserRequest,
        transcript,
        transcript_path: input.transcriptPath,
      })
    );
    attempts += 1;
  }
  return serialized;
};

export const stopOutput = (review: StopReview, alreadyBlocked: boolean) => {
  if (review.verdict === "ok") {
    return null;
  }
  if (review.verdict === "block" && !alreadyBlocked) {
    return {
      decision: "block",
      reason: review.additionalContext,
      systemMessage: correctionguyMessage(review.additionalContext),
    };
  }
  return {
    continue: true,
    systemMessage: correctionguyMessage(review.additionalContext),
  };
};
