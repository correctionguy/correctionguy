import { expect, test } from "bun:test";
import path from "node:path";

import { runStopReview, runTasteReview } from "./codex.ts";
import {
  StopReviewSchema,
  stopReviewContext,
  parseTranscript,
} from "./core.ts";
import { CLAUDE_PROMPTS } from "./prompts.ts";

const filler =
  "the agent read the file, ran the checks, and reported results ".repeat(13);

const syntheticTranscript = [
  ...Array.from({ length: 128 }, (_, index) =>
    JSON.stringify({
      message: {
        content: [{ text: `step ${index}: ${filler}`, type: "text" }],
      },
      type: index % 2 === 0 ? "user" : "assistant",
    })
  ),
  JSON.stringify({
    message: { content: [{ text: "please say hi", type: "text" }] },
    type: "user",
  }),
  JSON.stringify({
    message: { content: [{ text: "hi", type: "text" }] },
    type: "assistant",
  }),
].join("\n");

test("stop review round-trips a realistic payload against the configured codex model", async () => {
  const { lines, records } = parseTranscript(syntheticTranscript);
  const context = stopReviewContext({ lines, records });
  expect(context).not.toBeNull();
  expect(context?.length).toBeGreaterThan(50_000);
  const review = await runStopReview(CLAUDE_PROMPTS.stop, context ?? "");
  expect(StopReviewSchema.parse(review)).toEqual(review);
}, 150_000);

test("taste judge records a clear taste against the configured codex model", async () => {
  const taste = await runTasteReview(
    CLAUDE_PROMPTS.taste,
    JSON.stringify({
      user_prompt:
        "No, redo that table. Every time you print a table of numbers for me, right-align the numeric columns and use thousands separators. Left-aligned numbers are unreadable and I never want them again, in this project or any other.",
    })
  );
  expect(taste.file).not.toBe("");
  expect(taste.content).toContain(`name: ${path.basename(taste.file, ".md")}`);
}, 150_000);
