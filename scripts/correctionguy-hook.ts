import { CommandSchema, HookInputSchema, parseTranscript } from "./core.ts";
import { runHook } from "./correctionguy.ts";
import { CLAUDE_PROMPTS } from "./prompts.ts";

try {
  const command = CommandSchema.parse(Bun.argv.at(2));
  const hookInput = HookInputSchema.parse(await Bun.stdin.json());
  const output = await runHook(command, hookInput, {
    prompts: CLAUDE_PROMPTS,
    readTranscript: async () => {
      if (!hookInput.transcript_path) {
        throw new Error("transcript_path missing from hook input");
      }
      return parseTranscript(await Bun.file(hookInput.transcript_path).text());
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
