import { spawnSync } from "node:child_process";

import { Codex } from "@openai/codex-sdk";
import type { CodexOptions, ThreadOptions } from "@openai/codex-sdk";
import { once } from "es-toolkit";
import { z } from "zod/v4";

import { ReviewSchema, StopReviewSchema, TasteSchema } from "./core.ts";
import type { Review, StopReview, Taste } from "./core.ts";

const EnvSchema = z.object({
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
});

const REVIEW_TIMEOUT_MS = 120_000;
const SEAT_TIMEOUT_MS = 10_000;

const borrowTokenmaxxingSeat = once((): string | null => {
  try {
    const enabled = z
      .stringbool()
      .default(true)
      .parse(process.env.CORRECTIONGUY_TOKENMAXXING);
    if (!enabled) {
      return null;
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
    return dir === "" ? null : dir;
  } catch {
    return null;
  }
});

const runJsonReview = async <T>(
  prompt: string,
  context: string,
  schema: z.ZodType<T>
): Promise<T> => {
  const env = EnvSchema.parse(process.env);
  const threadOptions: ThreadOptions = {
    approvalPolicy: "never",
    model: env.CORRECTIONGUY_MODEL,
    modelReasoningEffort: env.CORRECTIONGUY_MODEL_REASONING_EFFORT,
    networkAccessEnabled: env.CORRECTIONGUY_YOLO,
    sandboxMode: env.CORRECTIONGUY_YOLO ? "danger-full-access" : "read-only",
    skipGitRepoCheck: true,
    webSearchMode: "live",
    workingDirectory: process.env.CLAUDE_PROJECT_DIR,
  };
  const codexOptions: CodexOptions = {
    config: {
      features: { fast_mode: env.CORRECTIONGUY_FAST_MODE },
      ...(env.CORRECTIONGUY_SERVICE_TIER === undefined
        ? {}
        : { service_tier: env.CORRECTIONGUY_SERVICE_TIER }),
    },
  };
  const seat = borrowTokenmaxxingSeat();
  const { finalResponse } = await new Codex(
    seat === null
      ? codexOptions
      : {
          ...codexOptions,
          env: { ...process.env, CODEX_HOME: seat },
        }
  )
    .startThread(threadOptions)
    .run(`${prompt}\n\n\`\`\`json\n${context}\n\`\`\``, {
      outputSchema: z.toJSONSchema(schema),
      signal: AbortSignal.timeout(REVIEW_TIMEOUT_MS),
    });
  return schema.parse(JSON.parse(finalResponse));
};

export const runReview = (prompt: string, context: string): Promise<Review> =>
  runJsonReview(prompt, context, ReviewSchema);

export const runStopReview = (
  prompt: string,
  context: string
): Promise<StopReview> => runJsonReview(prompt, context, StopReviewSchema);

export const runTasteReview = (
  prompt: string,
  context: string
): Promise<Taste> => runJsonReview(prompt, context, TasteSchema);
