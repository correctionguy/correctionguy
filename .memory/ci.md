# CI

- The `bun run test` log prints "correctionguy stop review failed: You've hit your usage limit" and "reviews skipped for the rest of this session" on a passing run: the text comes from the `scripts/session-breaker.test.ts` fixture. Judge a real usage-limit or Codex failure by a failed `scripts/codex-smoke.test.ts` case, not by that text
