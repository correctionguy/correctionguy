# TODO

Live task list for sessions where the host exposes no native todo tracker. Keep current: mark starts and dones as they happen.

- [x] SESSION_START: add no-native-tracker -> `.memory/TODO.md` rule
- [x] STOP_PROMPT nudge: judge todo drift from `.memory/TODO.md` when host gave no tracker
- [x] LIVE_MONITOR_PROMPT: context note + flag #7 read `.memory/TODO.md` when `todos` empty
- [x] skills/correctionguy/SKILL.md: Track section carries the rule
- [x] commands/correctionguy.md: item 2 Track carries the rule
- [x] AGENTS.md: record as User's Claim + update Live Monitor Data Sources
- [x] .memory: new memory file + MEMORY.md index line + cross-ref in live-monitor-todos-title-sources
- [x] Verify: bun run check, typecheck, validate + fresh reviewer on the diff (reviewer caught "both reviewer prompts read on empty todos" misclaim, fixed: stop check has no todos input)
- [ ] Ship release v3.11.0: bump 3 manifests, commit, push, tag, GitHub release
