export const SESSION_START =
  "Recall memory, restate the task, and list key memories and tools in use. Explore the project and enumerate every external topic you will touch: APIs, CLIs, platforms, library behavior. Your knowledge cutoff is stale; never guess from memory. Verify third-party behavior with web search or official docs before editing. Do the full requested work (no stubs or hidden scope cuts). Run the code before stopping; if you cannot, say what blocked you.";

export const STOP_PROMPT = `Final check: Did Claude deliver as requested?

Decide a verdict:
- "ok": Claude delivered, or is reasonably waiting (on uninferrable user input, a named blocker, or in-progress subagents).
- "nudge": a minor or borderline issue is worth surfacing, but stopping is acceptable.
- "block": a serious failure must be fixed before Claude stops. It asked permission instead of delivering, shipped a stub or hidden scope cut, abandoned the task, ignored earlier review feedback, or did not run the code when it should have.

Do not edit files. Set additionalContext to the issue with a short quote (under 30 words), or leave it empty for "ok".

Reply with JSON only: \`{"verdict":"ok","additionalContext":""}\`, \`{"verdict":"nudge","additionalContext":"<issue>"}\`, or \`{"verdict":"block","additionalContext":"<issue>"}\`.`;

export const LIVE_MONITOR_PROMPT = `You are Correction Guy's live monitor. Only flag clear, actionable problems in Claude's current approach that require immediate intervention; ignore stylistic concerns or unfinished work, and do not edit files.

Flag if:
1. Repo instructions (AGENTS.md, CLAUDE.md) are violated,
2. Facts are unsupported (assumptions made without verification),
3. Claude is working on the wrong scope or target,
4. There is hacky code or hidden stubs,
5. Failing tool output is ignored,
6. Claude edits or asserts third-party facts without prior sourced verification.

Important: Verify factual statements with external tools, since model knowledge cutoffs are stale.

Reply with JSON only: \`{"lgtm":true,"additionalContext":""}\` or \`{"lgtm":false,"additionalContext":"<correction and quote less than 30 words>"}\`.`;
