import { readdir } from "node:fs/promises";
import path from "node:path";

import {
  CommandSchema,
  HookInputSchema,
  MonitorCadence,
  parseTranscript,
} from "./core.ts";
import { runHook } from "./correctionguy.ts";
import { CLAUDE_PROMPTS } from "./prompts.ts";

try {
  const command = CommandSchema.parse(Bun.argv.at(2));
  const hookInput = HookInputSchema.parse(await Bun.stdin.json());
  const cadence = MonitorCadence.parse(
    Bun.env.CORRECTIONGUY_MONITOR_EVERY_BATCHES
  );
  const output = await runHook(command, hookInput, cadence, {
    prompts: CLAUDE_PROMPTS,
    readTranscript: async () => {
      const { agent_id, transcript_path } = hookInput;
      if (!transcript_path) {
        throw new Error("transcript_path missing from hook input");
      }
      if (!agent_id) {
        return parseTranscript(await Bun.file(transcript_path).text());
      }
      const root = path.join(
        path.dirname(transcript_path),
        path.basename(transcript_path, ".jsonl"),
        "subagents"
      );
      const entries = await readdir(root, { recursive: true });
      const entry = entries.find(
        (candidate) => path.basename(candidate) === `agent-${agent_id}.jsonl`
      );
      if (!entry) {
        throw new Error(
          `subagent transcript agent-${agent_id}.jsonl missing under ${root}`
        );
      }
      return parseTranscript(await Bun.file(path.join(root, entry)).text());
    },
  });
  if (output !== null) {
    console.log(JSON.stringify(output));
  }
} catch (error) {
  console.error(
    `correctionguy hook error: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(0);
}
