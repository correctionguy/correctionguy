import { expect, mock, test } from "bun:test";
import { existsSync } from "node:fs";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { TasteSchema, parseTranscript } from "./core.ts";
import type { Taste } from "./core.ts";
import { CLAUDE_PROMPTS } from "./prompts.ts";

let tasteReview: () => Promise<Taste> = () =>
  Promise.resolve({ content: "", file: "" });

mock.module("./codex.ts", () => ({
  runReview: () => Promise.resolve({ additionalContext: "", lgtm: true }),
  runStopReview: () =>
    Promise.resolve({ additionalContext: "", verdict: "ok" }),
  runTasteReview: () => tasteReview(),
}));

const { runHook, skipStatePath } = await import("./correctionguy.ts");

const deps = {
  prompts: CLAUDE_PROMPTS,
  readTranscript: () => Promise.resolve(parseTranscript("")),
};

const noComments: Taste = {
  content:
    "---\nname: no-code-comments\ndescription: User rejects code comments\n---\n\nThe user wants no code comments. Rationale goes in the PR body.\n",
  file: "no-code-comments.md",
};

test("a taste reply writes its file under .taste in the project dir", async () => {
  const project = await mkdtemp(path.join(tmpdir(), "correctionguy-taste-"));
  process.env.CLAUDE_PROJECT_DIR = project;
  tasteReview = () => Promise.resolve(noComments);
  const output = await runHook(
    "UserPromptSubmit",
    {
      prompt: "stop writing comments, I never want them",
      session_id: crypto.randomUUID(),
    },
    deps
  );
  const written = await readFile(
    path.join(project, ".taste", "no-code-comments.md"),
    "utf-8"
  );
  await rm(project, { force: true, recursive: true });
  expect(output).toBeNull();
  expect(written).toBe(noComments.content);
});

test("a no-taste reply leaves .taste untouched", async () => {
  const project = await mkdtemp(path.join(tmpdir(), "correctionguy-taste-"));
  process.env.CLAUDE_PROJECT_DIR = project;
  tasteReview = () => Promise.resolve({ content: "", file: "" });
  const output = await runHook(
    "UserPromptSubmit",
    { prompt: "run the tests", session_id: crypto.randomUUID() },
    deps
  );
  const created = existsSync(path.join(project, ".taste"));
  await rm(project, { force: true, recursive: true });
  expect(output).toBeNull();
  expect(created).toBe(false);
});

test("a symlinked taste file is replaced, never written through", async () => {
  const project = await mkdtemp(path.join(tmpdir(), "correctionguy-taste-"));
  process.env.CLAUDE_PROJECT_DIR = project;
  const outside = path.join(project, "outside.txt");
  await writeFile(outside, "keep me");
  await mkdir(path.join(project, ".taste"));
  await symlink(outside, path.join(project, ".taste", noComments.file));
  tasteReview = () => Promise.resolve(noComments);
  await runHook(
    "UserPromptSubmit",
    { prompt: "no comments ever", session_id: crypto.randomUUID() },
    deps
  );
  const target = path.join(project, ".taste", noComments.file);
  const kept = await readFile(outside, "utf-8");
  const targetStats = await lstat(target);
  const written = await readFile(target, "utf-8");
  await rm(project, { force: true, recursive: true });
  expect(kept).toBe("keep me");
  expect(targetStats.isFile()).toBe(true);
  expect(written).toBe(noComments.content);
});

test("a symlinked .taste directory is refused", async () => {
  const project = await mkdtemp(path.join(tmpdir(), "correctionguy-taste-"));
  process.env.CLAUDE_PROJECT_DIR = project;
  const outside = path.join(project, "outside");
  await mkdir(outside);
  await symlink(outside, path.join(project, ".taste"));
  tasteReview = () => Promise.resolve(noComments);
  const run = runHook(
    "UserPromptSubmit",
    { prompt: "no comments ever", session_id: crypto.randomUUID() },
    deps
  );
  await expect(run).rejects.toThrow("is not a directory");
  const escaped = existsSync(path.join(outside, noComments.file));
  await rm(project, { force: true, recursive: true });
  expect(escaped).toBe(false);
});

test("a judgment that finishes after a newer one on the same taste is dropped", async () => {
  const project = await mkdtemp(path.join(tmpdir(), "correctionguy-taste-"));
  process.env.CLAUDE_PROJECT_DIR = project;
  const older = Promise.withResolvers<Taste>();
  const newer = Promise.withResolvers<Taste>();
  tasteReview = () => older.promise;
  const first = runHook(
    "UserPromptSubmit",
    { prompt: "use tabs", session_id: crypto.randomUUID() },
    deps
  );
  await Bun.sleep(5);
  tasteReview = () => newer.promise;
  const second = runHook(
    "UserPromptSubmit",
    { prompt: "no, use spaces", session_id: crypto.randomUUID() },
    deps
  );
  newer.resolve({ content: "spaces", file: "indentation.md" });
  await second;
  older.resolve({ content: "tabs", file: "indentation.md" });
  await first;
  const written = await readFile(
    path.join(project, ".taste", "indentation.md"),
    "utf-8"
  );
  await rm(project, { force: true, recursive: true });
  expect(written).toBe("spaces");
});

test("a failed taste write surfaces and leaves the other reviews on", async () => {
  const project = await mkdtemp(path.join(tmpdir(), "correctionguy-taste-"));
  process.env.CLAUDE_PROJECT_DIR = project;
  await writeFile(path.join(project, ".taste"), "not a directory");
  const sessionId = crypto.randomUUID();
  tasteReview = () => Promise.resolve(noComments);
  const run = runHook(
    "UserPromptSubmit",
    { prompt: "no comments ever", session_id: sessionId },
    deps
  );
  await expect(run).rejects.toThrow();
  const marked = existsSync(skipStatePath(sessionId));
  await rm(project, { force: true, recursive: true });
  expect(marked).toBe(false);
});

test("a taste file name that leaves .taste or is not markdown fails the schema", () => {
  expect(TasteSchema.safeParse(noComments).success).toBe(true);
  expect(
    TasteSchema.safeParse({ ...noComments, file: "../AGENTS.md" }).success
  ).toBe(false);
  expect(
    TasteSchema.safeParse({ ...noComments, file: "no-code-comments" }).success
  ).toBe(false);
});

test("a reply with content but no file, or a file but no content, fails the schema", () => {
  expect(TasteSchema.safeParse({ content: "", file: "" }).success).toBe(true);
  expect(
    TasteSchema.safeParse({
      content: JSON.stringify(noComments),
      file: "",
    }).success
  ).toBe(false);
  expect(TasteSchema.safeParse({ ...noComments, content: "" }).success).toBe(
    false
  );
});
