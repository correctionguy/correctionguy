import { expect, test } from "bun:test";

import { runStopReview } from "./codex.ts";
import { StopReview, stopReviewContext, parseTranscript } from "./core.ts";
import { STOP_PROMPT } from "./prompts.ts";

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
  const review = await runStopReview(STOP_PROMPT, context ?? "");
  expect(StopReview.parse(review)).toEqual(review);
}, 150_000);
