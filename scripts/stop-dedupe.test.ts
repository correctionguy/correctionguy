import { expect, mock, test } from "bun:test";
import { existsSync } from "node:fs";
import { rm, unlink, writeFile } from "node:fs/promises";

import { NUDGE_COOLDOWN_MS, parseTranscript } from "./core.ts";
import type { StopReview } from "./core.ts";
import { CLAUDE_PROMPTS } from "./prompts.ts";

let stopReview: () => Promise<StopReview> = () =>
  Promise.resolve({ additionalContext: "", verdict: "ok" });

mock.module("./codex.ts", () => ({
  runReview: () => Promise.resolve({ additionalContext: "", lgtm: true }),
  runStopReview: () => stopReview(),
}));

const { nudgeStatePath, runHook, skipStatePath } =
  await import("./correctionguy.ts");

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

const deps = {
  prompts: CLAUDE_PROMPTS,
  readTranscript: () => Promise.resolve(transcript),
};

const noReviews: StopReview = {
  additionalContext: "Run tests before claiming fixed",
  verdict: "nudge",
};

test("a repeated nudge for the same correction fires once inside the cooldown", async () => {
  const sessionId = crypto.randomUUID();
  stopReview = () => Promise.resolve(noReviews);
  const first = await runHook("Stop", { session_id: sessionId }, 10, deps);
  const second = await runHook("Stop", { session_id: sessionId }, 10, deps);
  await unlink(nudgeStatePath(sessionId));
  expect(first).toEqual({
    continue: true,
    systemMessage: `(Correction Guy) [for ${sessionId}] Run tests before claiming fixed`,
  });
  expect(second).toBeNull();
});

test("a nudge with different correction text still fires inside the cooldown", async () => {
  const sessionId = crypto.randomUUID();
  const regression: StopReview = {
    additionalContext: "Fix the red typecheck before stopping",
    verdict: "nudge",
  };
  stopReview = () => Promise.resolve(noReviews);
  const first = await runHook("Stop", { session_id: sessionId }, 10, deps);
  stopReview = () => Promise.resolve(regression);
  const second = await runHook("Stop", { session_id: sessionId }, 10, deps);
  await unlink(nudgeStatePath(sessionId));
  expect(first).not.toBeNull();
  expect(second).toEqual({
    continue: true,
    systemMessage: `(Correction Guy) [for ${sessionId}] Fix the red typecheck before stopping`,
  });
});

test("a nudge fires again once the cooldown has passed", async () => {
  const sessionId = crypto.randomUUID();
  await writeFile(
    nudgeStatePath(sessionId),
    JSON.stringify({
      [`[for ${sessionId}] Run tests before claiming fixed`]:
        Date.now() - NUDGE_COOLDOWN_MS - 1,
    })
  );
  stopReview = () => Promise.resolve(noReviews);
  const output = await runHook("Stop", { session_id: sessionId }, 10, deps);
  await unlink(nudgeStatePath(sessionId));
  expect(output).toEqual({
    continue: true,
    systemMessage: `(Correction Guy) [for ${sessionId}] Run tests before claiming fixed`,
  });
});

test("a corrupt nudge state file drops the nudge and turns reviews off for the session", async () => {
  const sessionId = crypto.randomUUID();
  await writeFile(nudgeStatePath(sessionId), "not json");
  stopReview = () => Promise.resolve(noReviews);
  const output = await runHook("Stop", { session_id: sessionId }, 10, deps);
  await unlink(nudgeStatePath(sessionId));
  const marked = existsSync(skipStatePath(sessionId));
  await rm(skipStatePath(sessionId), { force: true });
  expect(output).toBeNull();
  expect(marked).toBe(true);
});

test("a block is never held back by an earlier notice for the same text", async () => {
  const sessionId = crypto.randomUUID();
  await writeFile(
    nudgeStatePath(sessionId),
    JSON.stringify({
      [`[for ${sessionId}] Run tests before claiming fixed`]: Date.now(),
    })
  );
  stopReview = () => Promise.resolve({ ...noReviews, verdict: "block" });
  const first = await runHook("Stop", { session_id: sessionId }, 10, deps);
  const second = await runHook("Stop", { session_id: sessionId }, 10, deps);
  await unlink(nudgeStatePath(sessionId));
  expect(first).toMatchObject({ decision: "block" });
  expect(second).toMatchObject({ decision: "block" });
});
