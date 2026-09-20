import { spawnSync } from "node:child_process";

import { Codex } from "@openai/codex-sdk";
import type { CodexOptions, ThreadOptions } from "@openai/codex-sdk";
import { z } from "zod/v4";

import { ReviewSchema, StopReviewSchema, jsonString } from "./core.ts";
import type { Review, StopReview } from "./core.ts";

const env = z
  .object({
    CORRECTIONGUY_FAST_MODE: z.stringbool().default(false),
    CORRECTIONGUY_MODEL: z.string().default("gpt-5.6-terra"),
    CORRECTIONGUY_MODEL_REASONING_EFFORT: z
      .enum([
        "minimal",
        "low",
        "medium",
        "high",
        "xhigh",
        "max",
        "ultra",
        "persistent",
      ])
      .default("xhigh"),
    CORRECTIONGUY_SERVICE_TIER: z.string().optional(),
    CORRECTIONGUY_YOLO: z.stringbool().default(false),
  })
  .parse(process.env);

const threadOptions: ThreadOptions = {
  approvalPolicy: "never",
  model: env.CORRECTIONGUY_MODEL,
  modelReasoningEffort: env.CORRECTIONGUY_MODEL_REASONING_EFFORT,
  networkAccessEnabled: env.CORRECTIONGUY_YOLO,
  sandboxMode: env.CORRECTIONGUY_YOLO ? "danger-full-access" : "read-only",
  skipGitRepoCheck: true,
  webSearchEnabled: true,
  webSearchMode: "live",
  workingDirectory:
    process.env.CLAUDE_PROJECT_DIR ??
    process.env.CURSOR_PROJECT_DIR ??
    process.cwd(),
};

const codexOptions: CodexOptions = {
  config: {
    features: { fast_mode: env.CORRECTIONGUY_FAST_MODE },
    ...(env.CORRECTIONGUY_SERVICE_TIER === undefined
      ? {}
      : { service_tier: env.CORRECTIONGUY_SERVICE_TIER }),
  },
};

const REVIEW_TIMEOUT_MS = 120_000;
const SEAT_TIMEOUT_MS = 10_000;

let borrowedSeat: string | null | undefined;

const borrowTokenmaxxingSeat = (): string | null => {
  if (borrowedSeat !== undefined) {
    return borrowedSeat;
  }
  try {
    const enabled = z
      .stringbool()
      .default(true)
      .parse(process.env.CORRECTIONGUY_TOKENMAXXING);
    if (!enabled) {
      borrowedSeat = null;
      return borrowedSeat;
    }
    const r = spawnSync(
      "tokenmaxxing",
      ["seat", "--codex", String(process.pid)],
      {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: SEAT_TIMEOUT_MS,
      }
    );
    const dir = r.status === 0 ? r.stdout.trim() : "";
    if (typeof r.status === "number" && r.status !== 0 && r.stderr) {
      console.error(`correctionguy: tokenmaxxing seat: ${r.stderr.trim()}`);
    }
    borrowedSeat = dir === "" ? null : dir;
  } catch {
    borrowedSeat = null;
  }
  return borrowedSeat;
};

const runJsonReview = async <T>(
  prompt: string,
  context: string,
  schema: z.ZodType<T>
): Promise<T> => {
  const seat = borrowTokenmaxxingSeat();
  const seatEnv: Record<string, string> = {};
  if (seat !== null) {
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        seatEnv[key] = value;
      }
    }
    seatEnv.CODEX_HOME = seat;
  }
  const { finalResponse } = await new Codex(
    seat === null ? codexOptions : { ...codexOptions, env: seatEnv }
  )
    .startThread(threadOptions)
    .run(`${prompt}\n\n\`\`\`json\n${context}\n\`\`\``, {
      outputSchema: z.toJSONSchema(schema),
      signal: AbortSignal.timeout(REVIEW_TIMEOUT_MS),
    });
  return jsonString(schema).parse(finalResponse);
};

export const runReview = (prompt: string, context: string): Promise<Review> =>
  runJsonReview(prompt, context, ReviewSchema);

export const runStopReview = (
  prompt: string,
  context: string
): Promise<StopReview> => runJsonReview(prompt, context, StopReviewSchema);
