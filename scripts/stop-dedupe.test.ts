import { expect, test } from "bun:test";
import { unlink, writeFile } from "node:fs/promises";

import { NUDGE_COOLDOWN_MS, parseTranscript } from "./core.ts";
import type { StopReview } from "./core.ts";
import { nudgeStatePath, runHook } from "./correctionguy.ts";
import { CLAUDE_PROMPTS } from "./prompts.ts";

const transcript = parseTranscript(
  [
    JSON.stringify({
      message: { content: [{ text: "fix the bug", type: "text" }] },
      type: "user",
    }),
    JSON.stringify({
      message: { content: [{ text: "fixed", type: "text" }] },
      type: "assistant",
    }),
  ].join("\n")
);

const noReviews: StopReview = {
  additionalContext: "no reviews: claimed fixed, ran nothing",
  failure: "no reviews",
  verdict: "nudge",
};

test("a repeated nudge for the same failure fires once inside the cooldown", async () => {
  const sessionId = crypto.randomUUID();
  const deps = {
    prompts: CLAUDE_PROMPTS,
    readTranscript: () => Promise.resolve(transcript),
    review: () => Promise.resolve({ additionalContext: "", lgtm: true }),
    stopReview: () => Promise.resolve(noReviews),
  };
  const first = await runHook("Stop", { session_id: sessionId }, 10, deps);
  const second = await runHook("Stop", { session_id: sessionId }, 10, deps);
  await unlink(nudgeStatePath(sessionId));
  expect(first).toEqual({
    continue: true,
    systemMessage: "(Correction Guy) no reviews: claimed fixed, ran nothing",
  });
  expect(second).toBeNull();
});

test("a nudge for a different failure still fires inside the cooldown", async () => {
  const sessionId = crypto.randomUUID();
  const regression: StopReview = {
    additionalContext: "regression: typecheck left red",
    failure: "regression",
    verdict: "nudge",
  };
  const first = await runHook("Stop", { session_id: sessionId }, 10, {
    prompts: CLAUDE_PROMPTS,
    readTranscript: () => Promise.resolve(transcript),
    review: () => Promise.resolve({ additionalContext: "", lgtm: true }),
    stopReview: () => Promise.resolve(noReviews),
  });
  const second = await runHook("Stop", { session_id: sessionId }, 10, {
    prompts: CLAUDE_PROMPTS,
    readTranscript: () => Promise.resolve(transcript),
    review: () => Promise.resolve({ additionalContext: "", lgtm: true }),
    stopReview: () => Promise.resolve(regression),
  });
  await unlink(nudgeStatePath(sessionId));
  expect(first).not.toBeNull();
  expect(second).toEqual({
    continue: true,
    systemMessage: "(Correction Guy) regression: typecheck left red",
  });
});

test("a nudge fires again once the cooldown has passed", async () => {
  const sessionId = crypto.randomUUID();
  await writeFile(
    nudgeStatePath(sessionId),
    JSON.stringify({ "no reviews": Date.now() - NUDGE_COOLDOWN_MS - 1 })
  );
  const output = await runHook("Stop", { session_id: sessionId }, 10, {
    prompts: CLAUDE_PROMPTS,
    readTranscript: () => Promise.resolve(transcript),
    review: () => Promise.resolve({ additionalContext: "", lgtm: true }),
    stopReview: () => Promise.resolve(noReviews),
  });
  await unlink(nudgeStatePath(sessionId));
  expect(output).toEqual({
    continue: true,
    systemMessage: "(Correction Guy) no reviews: claimed fixed, ran nothing",
  });
});

test("a block is never held back by an earlier notice for the same failure", async () => {
  const sessionId = crypto.randomUUID();
  await writeFile(
    nudgeStatePath(sessionId),
    JSON.stringify({ "no reviews": Date.now() })
  );
  const deps = {
    prompts: CLAUDE_PROMPTS,
    readTranscript: () => Promise.resolve(transcript),
    review: () => Promise.resolve({ additionalContext: "", lgtm: true }),
    stopReview: () =>
      Promise.resolve({ ...noReviews, verdict: "block" as const }),
  };
  const first = await runHook("Stop", { session_id: sessionId }, 10, deps);
  const second = await runHook("Stop", { session_id: sessionId }, 10, deps);
  await unlink(nudgeStatePath(sessionId));
  expect(first).toMatchObject({ decision: "block" });
  expect(second).toMatchObject({ decision: "block" });
});
