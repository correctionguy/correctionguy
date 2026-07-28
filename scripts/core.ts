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
const TranscriptRecord = z
  .looseObject({
    message: TranscriptMessage.optional(),
    role: z.string().optional(),
    type: z.string().optional(),
  })
  .transform((record) => ({
    ...record,
    type: record.type ?? record.role ?? "",
  }));
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

const ToolUseBlock = z.looseObject({
  id: z.string().optional(),
  input: z.unknown(),
  name: z.string(),
  type: z.literal("tool_use"),
});
const ToolResultBlock = z.looseObject({
  content: z.unknown(),
  tool_use_id: z.string().optional(),
  type: z.literal("tool_result"),
});
const TodoWriteInput = z.looseObject({
  todos: z.array(z.looseObject({ content: z.string(), status: z.string() })),
});
const TaskUpdateInput = z.looseObject({
  status: z.string().optional(),
  subject: z.string().optional(),
  taskId: z.string(),
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
  session_id: z.string().optional(),
  stop_hook_active: z.boolean().optional(),
  tool_calls: z.array(PostToolBatchToolCall).optional(),
  transcript_path: z.string().optional(),
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

const TodoItem = z.object({ content: z.string(), status: z.string() });
const LiveMonitorContext = z.object({
  current_tool_batch: z.array(PostToolBatchToolCall),
  latest_assistant_message: z.string(),
  recent_transcript: z.string(),
  todos: z.array(TodoItem),
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

export interface ContextOutput {
  hookSpecificOutput: {
    additionalContext: string;
    hookEventName: ContextHookEvent;
  };
  systemMessage: string;
}
export interface StopBlockOutput {
  decision: "block";
  reason: string;
  systemMessage: string;
}
export interface ContinueOutput {
  continue: true;
  systemMessage: string;
}
export type HookOutput = ContextOutput | StopBlockOutput | ContinueOutput;

export const hookContextOutput = (
  hookEventName: ContextHookEvent,
  additionalContext: string
): ContextOutput => ({
  hookSpecificOutput: { additionalContext, hookEventName },
  systemMessage: correctionguyMessage(additionalContext),
});

const TRUNCATED_PREFIX = "[earlier review context truncated to fit the model]";

const currentTodos = (
  records: TranscriptRecord[]
): z.output<typeof TodoItem>[] => {
  const tasks = new Map<string, z.output<typeof TodoItem>>();
  let snapshot: z.output<typeof TodoItem>[] | null = null;
  for (const record of records) {
    for (const block of record.message?.content ?? []) {
      const toolUse = ToolUseBlock.safeParse(block);
      if (toolUse.success) {
        const { input, name } = toolUse.data;
        if (name === "TodoWrite") {
          const write = TodoWriteInput.safeParse(input);
          if (write.success) {
            snapshot = write.data.todos.map((todo) => ({
              content: todo.content,
              status: todo.status,
            }));
          }
          continue;
        }
        const update = TaskUpdateInput.safeParse(input);
        const task =
          name === "TaskUpdate" && update.success
            ? tasks.get(update.data.taskId)
            : undefined;
        if (task && update.success) {
          if (update.data.status === "deleted") {
            tasks.delete(update.data.taskId);
          } else {
            task.status = update.data.status ?? task.status;
            task.content = update.data.subject ?? task.content;
          }
        }
        continue;
      }
      const result = ToolResultBlock.safeParse(block);
      if (!result.success) {
        continue;
      }
      const text = [result.data.content]
        .flat()
        .map((part) =>
          typeof part === "string"
            ? part
            : ((part as { text?: string }).text ?? "")
        )
        .join("");
      const match =
        /Task #(?<taskId>\d+) created successfully: (?<subject>.+)/u.exec(text);
      if (match?.groups) {
        const { subject, taskId } = match.groups;
        tasks.set(taskId, { content: subject, status: "pending" });
      }
    }
  }
  return snapshot ?? [...tasks.values()];
};

export const liveMonitorContext = (input: {
  cadence: number;
  lines: string[];
  records: TranscriptRecord[];
  toolCalls: PostToolBatchToolCall[];
}): string | null => {
  const { cadence, lines, records, toolCalls } = input;
  const batchCount = records.filter(
    (record) =>
      record.type === "assistant" &&
      (record.message?.content ?? []).some((block) => block.type === "tool_use")
  ).length;
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

  const todos = currentTodos(records);
  let recentTranscript = takeRight(lines, RECENT_TRANSCRIPT_LINES).join("\n");
  let serialized = JSON.stringify(
    LiveMonitorContext.parse({
      current_tool_batch: toolCalls,
      latest_assistant_message: latestAssistant,
      recent_transcript: recentTranscript,
      todos,
    })
  );
  let attempts = 0;
  while (
    serialized.length > MAX_CONTEXT_CHARS &&
    recentTranscript.length > 0 &&
    attempts < 6
  ) {
    const overshoot = serialized.length - MAX_CONTEXT_CHARS;
    const newLen = Math.max(0, recentTranscript.length - overshoot - 256);
    recentTranscript =
      newLen > 0
        ? `${TRUNCATED_PREFIX}\n${recentTranscript.slice(-newLen)}`
        : TRUNCATED_PREFIX;
    serialized = JSON.stringify(
      LiveMonitorContext.parse({
        current_tool_batch: toolCalls,
        latest_assistant_message: latestAssistant,
        recent_transcript: recentTranscript,
        todos,
      })
    );
    attempts += 1;
  }
  return serialized;
};

export const liveMonitorOutput = (review: Review): ContextOutput | null =>
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

export const stopOutput = (
  review: StopReview,
  alreadyBlocked: boolean
): StopBlockOutput | ContinueOutput | null => {
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
