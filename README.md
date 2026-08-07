<img src="images/logo.jpg" alt="Correction Guy" width="200" align="right">

A second pair of eyes for your coding agent. Correction Guy watches from the sidelines and steers the work back on track — it never touches the work itself. Packaged as an [Agent Plugins](https://agent-plugins.org/) 1.0.0 plugin (portable skills in `skills/` behind root `plugin.json`) with host adapters for **Claude Code**, **Cursor**, and **Pi**.

An agent grading its own work is the weakest check there is. It is biased toward declaring victory: it papers over stubs, asserts things it never verified, asks permission instead of delivering, and forgets what it just learned. A sharper self-prompt doesn't fix this — the agent is still inside its own story.

So Correction Guy hands the review to someone else. A different model (Codex, through the [Codex SDK](https://developers.openai.com/codex/sdk/) — no other plugin required) reads the session as an outsider, with no stake in the agent's narrative, and calls out what the agent talked itself past. It is deliberately narrow: it flags real failures — wrong scope, stubs, unsourced claims, ignored test failures, abandoned work, drift, a to-do list or memory gone stale, BS status talk — and stays quiet on taste like naming, formatting, and structure. It steps in at the three moments that matter: as work begins, while it is underway, and the instant the agent tries to call it done.

## What it does

- **Session prelude** — sets expectations up front: restate the task, check memory, keep the to-do list and session title honest, verify third-party behavior, finish the work, run the code.
- **Live monitor** — every few tool batches, an outside pass catches drift, bad assumptions, stale to-dos, and contradicted memory before they compound.
- **Stop check** — when the agent tries to stop, the reviewer can block a premature "done" — a stub, abandoned work, ignored feedback, an unrun build — and feed the correction back.
- **On-demand** — the `correctionguy` skill (`/correctionguy`) restates the discipline whenever you want it.
- **Actually** — `/correctionguy:actually` is user-triggered when Correction Guy rooted on an old, outdated, or wrong convention: the agent records the override in `.memory` and applies it from then on.
- **Setup** — the `correctionguy:setup` skill lays out `.memory`, folds the agent's native memory in behind a symlink, and fans out subagents across every past session on the repo to mine durable learnings into memory.

The review prompts, and the corrections that come back, are written in compressed "caveman" style to save tokens.

## Memory

Memory belongs with the code it describes. Correction Guy keeps the agent's memory in a project-local `.memory` folder, so it lives alongside the work instead of in a global store, and it treats facts you state about the project as sourced — recorded, trusted, and never second-guessed for lacking a citation. The folder is git-tracked and travels with the repo, so it holds public knowledge only: treat it like a public Wikipedia page, and keep device, Slack, and environment details out of it. The reviewer flags when a session contradicts what is written there, learns something worth keeping and never writes it down, or records something non-public.

## Requirements

- [Bun](https://bun.sh) — for the Claude Code and Cursor hooks
- Codex authenticated — run `codex login` once, or set an API key.
- **Claude Code**, **Cursor**, or **Pi**

## Install

**Agent Plugins clients** (Cursor, ChatGPT/Codex, GitHub Copilot, VS Code, Kiro, and others that load the open format)

Install or clone this repository as a plugin. Compatible clients discover root `plugin.json` and the skills under `skills/`. Host-specific hooks and the Cursor `/cursor-setup` command stay in the Claude/Cursor compatibility layers and are ignored by clients that only load the portable core.

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

The installer merges Correction Guy's `sessionStart`, `preToolUse`, `postToolUse`, and `stop` entries into `~/.cursor/hooks.json` with absolute paths and preserves everything else in that file; re-running it always converges. Update later with `git pull` in the same folder, then re-run the installer so new hook entries land. The [Cursor Marketplace](https://cursor.com/marketplace) plugin still provides the skills and `/cursor-setup`, which walks the agent through these exact steps.

Cursor injects hook context where the running generation never reads it, so live-monitor corrections would otherwise sit unread until the next turn. The `preToolUse` hook fixes that: when a review flags the session, Correction Guy holds the very next tool call and delivers the correction through the denial message, which the agent reads immediately. The correction still lands in conversation context as well, so installs that have not re-run the installer keep the older next-turn delivery instead of losing corrections. Note that Cursor launches hooks with a constructed environment, not your shell's, so `CORRECTIONGUY_*` variables exported in your shell do not reach the reviews there; defaults apply.

**Pi**

```sh
pi install git:github.com/correctionguy/correctionguy
```

Or try it for a single run with `pi -e git:github.com/correctionguy/correctionguy`.

## Configuration

Everything is tuned through `CORRECTIONGUY_*` environment variables — model, reasoning effort, review cadence, and a `CORRECTIONGUY_YOLO` switch that drops the read-only sandbox for the reviews. Defaults live in `scripts/codex.ts`. You're going to ask an agent to do it, so I'm not going to write it out here 😏

Licensed under [MIT](LICENSE).
