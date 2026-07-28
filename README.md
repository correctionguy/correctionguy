<img src="images/logo.jpg" alt="Correction Guy" width="200" align="right">

A second pair of eyes for your coding agent. Correction Guy watches from the sidelines and steers the work back on track — it never touches the work itself. Works in **Claude Code**, **Cursor**, and **Pi**.

An agent grading its own work is the weakest check there is. It is biased toward declaring victory: it papers over stubs, asserts things it never verified, asks permission instead of delivering, and forgets what it just learned. A sharper self-prompt doesn't fix this — the agent is still inside its own story.

So Correction Guy hands the review to someone else. A different model (Codex, through the [Codex SDK](https://developers.openai.com/codex/sdk/) — no other plugin required) reads the session as an outsider, with no stake in the agent's narrative, and calls out what the agent talked itself past. It is deliberately narrow: it flags real failures — wrong scope, stubs, unsourced claims, ignored test failures, abandoned work, drift, a to-do list or memory gone stale — and stays quiet on taste like naming, formatting, and structure. It steps in at the three moments that matter: as work begins, while it is underway, and the instant the agent tries to call it done.

## What it does

- **Session prelude** — sets expectations up front: restate the task, check memory, keep the to-do list and session title honest, verify third-party behavior, finish the work, run the code.
- **Live monitor** — every few tool batches, an outside pass catches drift, bad assumptions, stale to-dos, and contradicted memory before they compound.
- **Stop check** — when the agent tries to stop, the reviewer can block a premature "done" — a stub, abandoned work, ignored feedback, an unrun build — and feed the correction back.
- **On-demand** — `/correctionguy` restates the discipline whenever you want it.
- **Setup** — the `correctionguy:setup` skill lays out `.memory`, folds the agent's native memory in behind a symlink, and fans out subagents across every past session on the repo to mine durable learnings into memory.

The review prompts, and the corrections that come back, are written in compressed "caveman" style to save tokens.

## Memory

Memory belongs with the code it describes. Correction Guy keeps the agent's memory in a project-local `.memory` folder, so it lives alongside the work instead of in a global store, and it treats facts you state about the project as sourced — recorded, trusted, and never second-guessed for lacking a citation. The folder is git-tracked and travels with the repo, so it holds public knowledge only: treat it like a public Wikipedia page, and keep device, Slack, and environment details out of it. The reviewer flags when a session contradicts what is written there, learns something worth keeping and never writes it down, or records something non-public.

## Requirements

- [Bun](https://bun.sh) — for the Claude Code and Cursor hooks
- Codex authenticated — run `codex login` once, or set an API key.
- **Claude Code**, **Cursor**, or **Pi**

## Install

**Claude Code**

```sh
/plugin marketplace add correctionguy/correctionguy
```

```sh
/plugin install correctionguy@correctionguy
```

**Cursor**

Cursor never executes plugin-shipped hooks (they appear under Settings but do not run), so install the hooks directly:

```sh
git clone https://github.com/correctionguy/correctionguy ~/.cursor/correctionguy
cd ~/.cursor/correctionguy && bun install
bun scripts/cursor-install.ts
```

The installer merges Correction Guy's `sessionStart`, `postToolUse`, and `stop` entries into `~/.cursor/hooks.json` with absolute paths and preserves everything else in that file; re-running it always converges. Update later with `git pull` in the same folder. The [Cursor Marketplace](https://cursor.com/marketplace) plugin still provides the commands, and `/cursor-setup` walks the agent through these exact steps.

**Pi**

```sh
pi install git:github.com/correctionguy/correctionguy
```

Or try it for a single run with `pi -e git:github.com/correctionguy/correctionguy`.

## Configuration

Everything is tuned through `CORRECTIONGUY_*` environment variables — model, reasoning effort, review cadence, and a `CORRECTIONGUY_YOLO` switch that drops the read-only sandbox for the reviews. Defaults live in `scripts/codex.ts`. You're going to ask an agent to do it, so I'm not going to write it out here 😏

Licensed under [MIT](LICENSE).
