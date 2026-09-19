import { Command, HookInput, MonitorCadence, parseTranscript } from "./core.ts";
import { runHook } from "./correctionguy.ts";
import { CLAUDE_PROMPTS } from "./prompts.ts";

try {
  const command = Command.parse(Bun.argv.at(2));
  const hookInput = HookInput.parse(await Bun.stdin.json());
  const cadence = MonitorCadence.parse(
    Bun.env.CORRECTIONGUY_MONITOR_EVERY_BATCHES ?? 10
  );
  const output = await runHook(command, hookInput, cadence, {
    prompts: CLAUDE_PROMPTS,
    readTranscript: async () => {
      const path = hookInput.transcript_path;
      if (!path) {
        throw new Error("transcript_path missing from hook input");
      }
      return parseTranscript(await Bun.file(path).text());
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
