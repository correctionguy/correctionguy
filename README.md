# Correction Guy

Correction Guy keeps the agent honest. It reviews tool batches for drift and bad assumptions, and holds the agent back from stopping with unfinished work.

It talks to Codex directly through the [Codex SDK](https://developers.openai.com/codex/sdk/), no other plugin required.

Works in **Claude Code** and **Cursor**.

## What it does

**Live monitor.** Every few completed tool batches, a Codex pass scans the recent transcript for instruction violations, unsupported assumptions, and drift. Anything off is surfaced in the session and fed back before the agent continues.

**Session prelude.** At session start, the agent is reminded to check memory, restate the task, surface useful tools, verify third-party behavior before editing, finish the full work, and run the code.

**Stop check.** When the agent tries to stop, a Codex pass reviews the last response and returns a verdict. A minor issue is surfaced as an advisory message; a serious failure (asking permission instead of delivering, a stub, abandoned work, ignored review feedback, or skipping a required run) blocks the stop and feeds the correction back so work continues.

**On-demand reminder.** A `/correctionguy` command (Cursor) or `/correctionguy:correctionguy` slash command (Claude Code) reminds the agent to understand the task, do the full work, run the code, and ask for candid review.

## YOLO mode

By default the hook reviews run Codex in a read-only sandbox. Set `CORRECTIONGUY_YOLO=1` to drop the OS sandbox: Codex threads get full filesystem and network access, with their limits conveyed by prompt text instead.

## Requirements

- [Bun](https://bun.sh)
- Codex authenticated. Run `codex login` once, or set an API key.
- **Claude Code** ([claude.ai/code](https://claude.ai/code)) or **Cursor**

## Installation

### Claude Code

```sh
/plugin marketplace add correctionguy/correctionguy
/plugin install correctionguy@correctionguy
```

### Cursor

From the repo root (after `bun install`):

```sh
# Install from a local checkout
cursor plugin marketplace add /path/to/correctionguy
cursor plugin install correctionguy@correctionguy
```

Or symlink for immediate local development:

```sh
ln -sf "$(pwd)" ~/.cursor/plugins/local/correctionguy
cd ~/.cursor/plugins/local/correctionguy && bun install
```

Restart Cursor, then confirm the plugin and hooks appear under **Settings, Plugins** and **Settings, Hooks**.

## Configuration

All knobs are environment variables; everything else is hardcoded.

| Variable                               | Default   | Description                                                                |
| -------------------------------------- | --------- | -------------------------------------------------------------------------- |
| `CORRECTIONGUY_MODEL`                  | `gpt-5.5` | Codex model used for live-monitor and stop reviews                         |
| `CORRECTIONGUY_MODEL_REASONING_EFFORT` | `xhigh`   | Reasoning effort: `minimal`, `low`, `medium`, `high`, or `xhigh`           |
| `CORRECTIONGUY_SERVICE_TIER`           | `fast`    | Codex service tier (e.g. `fast`, `flex`, `priority`)                       |
| `CORRECTIONGUY_FAST_MODE`              | `true`    | Enable Codex fast mode (`true`/`false`, `1`/`0`, `on`/`off`)               |
| `CORRECTIONGUY_MONITOR_EVERY_BATCHES`  | `3`       | Completed tool batches between live-monitor reviews; `0` disables it       |
| `CORRECTIONGUY_YOLO`                   | `false`   | Drop the OS sandbox for hook reviews (`true`/`false`, `1`/`0`, `on`/`off`) |

## Development

```sh
bun install
bun run check      # lint + format (ultracite)
bun run typecheck  # tsc
bun run validate   # validate the plugin and marketplace manifests
```

There is no automated test suite in this repo. Hook logic is exercised manually in live Claude Code sessions; Codex-backed reviews need auth and the network.

Inspect the hooks and skills inside your editor:

```text
# Claude Code
/hooks
/correctionguy:correctionguy

# Cursor
Settings, Hooks
Settings, Plugins, correctionguy
/correctionguy
```
