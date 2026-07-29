import { expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { pendingCorrectionPath } from "./cursor-adapter.ts";

const hookPath = fileURLToPath(
  new URL("cursor-correctionguy-hook.ts", import.meta.url)
);

test("preToolUse delivers a pending correction as deny and consumes it", async () => {
  const conversationId = crypto.randomUUID();
  const generationId = crypto.randomUUID();
  const target = pendingCorrectionPath(conversationId);
  await writeFile(
    target,
    JSON.stringify({ generation_id: generationId, message: "wrong scope" }),
    { mode: 0o600 }
  );
  const proc = Bun.spawn(["bun", hookPath, "preToolUse"], {
    stderr: "pipe",
    stdin: "pipe",
    stdout: "pipe",
  });
  proc.stdin.write(
    JSON.stringify({
      conversation_id: conversationId,
      generation_id: generationId,
      tool_name: "Shell",
    })
  );
  await proc.stdin.end();
  const [stdout, code] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);
  expect(code).toBe(0);
  const output = JSON.parse(stdout) as {
    agent_message: string;
    permission: string;
    user_message: string;
  };
  expect(output.permission).toBe("deny");
  expect(output.user_message).toContain("wrong scope");
  expect(output.agent_message).toContain("wrong scope");
  expect(output.agent_message).toContain("Correction wins over held call");
  await expect(readFile(target, "utf-8")).rejects.toThrow();
});

test("preToolUse stays silent without a pending correction", async () => {
  const proc = Bun.spawn(["bun", hookPath, "preToolUse"], {
    stderr: "pipe",
    stdin: "pipe",
    stdout: "pipe",
  });
  proc.stdin.write(
    JSON.stringify({
      conversation_id: crypto.randomUUID(),
      generation_id: crypto.randomUUID(),
      tool_name: "Shell",
    })
  );
  await proc.stdin.end();
  const [stdout, code] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);
  expect(code).toBe(0);
  expect(stdout).toBe("");
});

test("preToolUse drops a stale-generation correction without denying", async () => {
  const conversationId = crypto.randomUUID();
  const target = pendingCorrectionPath(conversationId);
  await writeFile(
    target,
    JSON.stringify({
      generation_id: crypto.randomUUID(),
      message: "stale correction",
    }),
    { mode: 0o600 }
  );
  const proc = Bun.spawn(["bun", hookPath, "preToolUse"], {
    stderr: "pipe",
    stdin: "pipe",
    stdout: "pipe",
  });
  proc.stdin.write(
    JSON.stringify({
      conversation_id: conversationId,
      generation_id: crypto.randomUUID(),
      tool_name: "Shell",
    })
  );
  await proc.stdin.end();
  const [stdout, code] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);
  expect(code).toBe(0);
  expect(stdout).toBe("");
  await expect(readFile(target, "utf-8")).rejects.toThrow();
});

test("preToolUse survives a non-uuid conversation id without breaking the host", async () => {
  const proc = Bun.spawn(["bun", hookPath, "preToolUse"], {
    stderr: "pipe",
    stdin: "pipe",
    stdout: "pipe",
  });
  proc.stdin.write(
    JSON.stringify({
      conversation_id: "../../etc/passwd",
      generation_id: crypto.randomUUID(),
      tool_name: "Shell",
    })
  );
  await proc.stdin.end();
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  expect(code).toBe(0);
  expect(stdout).toBe("");
  expect(stderr).toContain("correctionguy hook error");
});
