import { Codex } from "@openai/codex-sdk";
import type {
  ModelReasoningEffort,
  SandboxMode,
  ThreadOptions,
} from "@openai/codex-sdk";
import { z } from "zod/v4";

import { Review, StopReview, jsonString } from "./core.ts";

export const cwd =
  Bun.env.CLAUDE_PROJECT_DIR ?? Bun.env.CURSOR_PROJECT_DIR ?? process.cwd();

const yolo = z.stringbool().default(false).parse(Bun.env.CORRECTIONGUY_YOLO);

const serviceTier = z
  .string()
  .default("fast")
  .parse(Bun.env.CORRECTIONGUY_SERVICE_TIER);

const fastMode = z
  .stringbool()
  .default(true)
  .parse(Bun.env.CORRECTIONGUY_FAST_MODE);

const reviewModel = z
  .string()
  .default("gpt-5.5")
  .parse(Bun.env.CORRECTIONGUY_MODEL);

const reviewEffort = z
  .enum(["minimal", "low", "medium", "high", "xhigh"])
  .default("xhigh")
  .parse(Bun.env.CORRECTIONGUY_MODEL_REASONING_EFFORT);

const threadOptions = (
  model: string,
  effort: ModelReasoningEffort
): ThreadOptions => {
  const sandboxMode: SandboxMode = yolo ? "danger-full-access" : "read-only";
  return {
    approvalPolicy: "never",
    model,
    modelReasoningEffort: effort,
    networkAccessEnabled: sandboxMode === "danger-full-access",
    sandboxMode,
    skipGitRepoCheck: true,
    webSearchEnabled: true,
    webSearchMode: "live",
    workingDirectory: cwd,
  };
};

const newCodex = () =>
  new Codex({
    config: { features: { fast_mode: fastMode }, service_tier: serviceTier },
  });

const REVIEW_TIMEOUT_MS = 120_000;

export const withTimeout = async <T>(
  ms: number,
  fn: (signal: AbortSignal) => Promise<T>
): Promise<T> => {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), ms);
  try {
    return await fn(abort.signal);
  } catch (error) {
    if (abort.signal.aborted) {
      const timeoutError = new Error("Codex call timed out", { cause: error });
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const runJsonReview = <T>(
  prompt: string,
  context: string,
  schema: z.ZodType<T>
): Promise<T> =>
  withTimeout(REVIEW_TIMEOUT_MS, async (signal) => {
    const { finalResponse } = await newCodex()
      .startThread(threadOptions(reviewModel, reviewEffort))
      .run(`${prompt}\n\n\`\`\`json\n${context}\n\`\`\``, {
        outputSchema: z.toJSONSchema(schema),
        signal,
      });
    return jsonString(schema).parse(finalResponse);
  });

export const runReview = (prompt: string, context: string): Promise<Review> =>
  runJsonReview(prompt, context, Review);

export const runStopReview = (
  prompt: string,
  context: string
): Promise<StopReview> => runJsonReview(prompt, context, StopReview);
