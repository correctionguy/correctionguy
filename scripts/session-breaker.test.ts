import { expect, mock, test } from "bun:test";
import { existsSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";

import { parseTranscript } from "./core.ts";
import type { Review, StopReview } from "./core.ts";
import { CLAUDE_PROMPTS } from "./prompts.ts";

let reviewCalls = 0;
let review: () => Promise<Review> = () =>
  Promise.resolve({ additionalContext: "", lgtm: true });
let stopReview: () => Promise<StopReview> = () =>
  Promise.resolve({ additionalContext: "", verdict: "ok" });

mock.module("./codex.ts", () => ({
  runReview: () => {
    reviewCalls += 1;
    return review();
  },
  runStopReview: () => {
    reviewCalls += 1;
    return stopReview();
  },
}));

const { runHook, skipStatePath } = await import("./correctionguy.ts");

const transcript = parseTranscript(
  [
    JSON.stringify({
      message: { content: [{ text: "fix the bug", type: "text" }] },
      type: "user",
    }),
    JSON.stringify({
      message: {
        content: [{ id: "call_1", input: {}, name: "Bash", type: "tool_use" }],
      },
      type: "assistant",
    }),
    JSON.stringify({
      message: { content: [{ text: "fixed", type: "text" }] },
      type: "assistant",
    }),
  ].join("\n")
);

const deps = {
  prompts: CLAUDE_PROMPTS,
  readTranscript: () => Promise.resolve(transcript),
};

const usageLimit = () =>
  Promise.reject(new Error("You've hit your usage limit"));
const okReview = () => Promise.resolve({ additionalContext: "", lgtm: true });
const okStop = () =>
  Promise.resolve<StopReview>({ additionalContext: "", verdict: "ok" });

test("a failed stop review turns every later review of the session off", async () => {
  const sessionId = crypto.randomUUID();
  stopReview = usageLimit;
  review = okReview;
  reviewCalls = 0;
  const first = await runHook("Stop", { session_id: sessionId }, 1, deps);
  const marked = existsSync(skipStatePath(sessionId));
  stopReview = okStop;
  const second = await runHook("Stop", { session_id: sessionId }, 1, deps);
  const batch = await runHook(
    "PostToolBatch",
    { session_id: sessionId, tool_calls: [] },
    1,
    deps
  );
  await rm(skipStatePath(sessionId), { force: true });
  expect(first).toBeNull();
  expect(marked).toBe(true);
  expect(second).toBeNull();
  expect(batch).toBeNull();
  expect(reviewCalls).toBe(1);
});

test("a failed live-monitor review turns the stop check off as well", async () => {
  const sessionId = crypto.randomUUID();
  review = usageLimit;
  stopReview = okStop;
  reviewCalls = 0;
  const batch = await runHook(
    "PostToolBatch",
    { session_id: sessionId, tool_calls: [] },
    1,
    deps
  );
  const stop = await runHook("Stop", { session_id: sessionId }, 1, deps);
  await rm(skipStatePath(sessionId), { force: true });
  expect(batch).toBeNull();
  expect(stop).toBeNull();
  expect(reviewCalls).toBe(1);
});

test("a session start clears the marker so the next review runs", async () => {
  const sessionId = crypto.randomUUID();
  await writeFile(skipStatePath(sessionId), "", { mode: 0o600 });
  stopReview = okStop;
  reviewCalls = 0;
  const preamble = await runHook(
    "SessionStart",
    { session_id: sessionId },
    1,
    deps
  );
  const cleared = !existsSync(skipStatePath(sessionId));
  const stop = await runHook("Stop", { session_id: sessionId }, 1, deps);
  await rm(skipStatePath(sessionId), { force: true });
  expect(preamble).toMatchObject({
    hookSpecificOutput: { hookEventName: "SessionStart" },
  });
  expect(cleared).toBe(true);
  expect(stop).toBeNull();
  expect(reviewCalls).toBe(1);
});

test("a tripped session leaves other sessions reviewing", async () => {
  const tripped = crypto.randomUUID();
  const other = crypto.randomUUID();
  stopReview = usageLimit;
  await runHook("Stop", { session_id: tripped }, 1, deps);
  stopReview = okStop;
  reviewCalls = 0;
  const output = await runHook("Stop", { session_id: other }, 1, deps);
  await rm(skipStatePath(tripped), { force: true });
  expect(output).toBeNull();
  expect(reviewCalls).toBe(1);
});
