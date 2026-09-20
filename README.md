<img src="images/logo.jpg" alt="Correction Guy" width="200" align="right">

A second pair of eyes for your coding agent. Correction Guy watches from the sidelines and steers the work back on track — it never touches the work itself. Packaged as an [Agent Plugins](https://agent-plugins.org/) 1.0.0 plugin (portable skills in `skills/` behind root `plugin.json`) with host adapters for **Claude Code**, **Cursor**, and **Pi**.

An agent grading its own work is the weakest check there is. It is biased toward declaring victory: it papers over stubs, asserts things it never verified, asks permission instead of delivering, and never checks what it changed. A sharper self-prompt doesn't fix this — the agent is still inside its own story.

So Correction Guy hands the review to someone else. A different model (Codex, through the [Codex SDK](https://developers.openai.com/codex/sdk/) — no other plugin required) reads the session as an outsider, with no stake in the agent's narrative, and calls out what the agent talked itself past. It is deliberately narrow: it flags six failures and stays quiet on taste like naming, formatting, and structure. It steps in at the three moments that matter: as work begins, while it is underway, and the instant the agent tries to call it done.

- **Unverified assumption**: builds on a guess about the system instead of checking it in the workspace.
- **Missed requirement**: leaves out behavior the instruction requires: the user's ask to its end gate (a fix that is fixed, a release that is released) and whatever the instruction files the host loads require.
- **Integration error**: right idea, wired into the surrounding system incorrectly.
- **Regression**: breaks existing behavior while making the change.
- **Wrong file**: delivers the change somewhere the running application never calls, such as a one-off script.
- **No reviews**: never reviewed nor verified what it changed, programmatically (tests, a smoke run) or empirically (a reviewer agent, when the project defines one).

## What it does

- **Session prelude**: sets expectations up front: recall memory, restate the task, then the six failures to avoid.
- **Live monitor**: every few tool batches, an outside pass catches the six failures before they compound.
- **Stop check**: when the agent tries to stop, the reviewer can block a premature "done" (a missed requirement, a stub, an unrun test, a fix that is still a proposal) and feed the correction back. A non-blocking nudge repeats at most once per 30 minutes per session; a block is never held back.
- **On-demand**: the `correctionguy` skill (`/correctionguy`) restates the discipline whenever you want it.
- **Actually**: `/correctionguy:actually` is user-triggered when Correction Guy rooted on an old, outdated, or wrong convention: the agent records the override in `.memory` and applies it from then on.
- **Setup**: the `correctionguy:setup` skill lays out `.memory`, folds the agent's native memory in behind a symlink, and fans out subagents across every past session on the repo to mine durable learnings into memory.

The review prompts, and the corrections that come back, are written in compressed "caveman" style to save tokens.

## Memory

Memory belongs with the code it describes. Correction Guy keeps the agent's memory in a project-local `.memory` folder, so it lives alongside the work instead of in a global store, and it treats facts you state about the project as sourced — recorded, trusted, and never second-guessed for lacking a citation. The folder is git-tracked and travels with the repo, so it holds public knowledge only: treat it like a public Wikipedia page, and keep device, Slack, and environment details out of it. The reviewer reads it as workspace truth: a session that contradicts what is written there is an unverified assumption, and a recorded claim is never flagged as unsourced. Rules about what to record there belong in your project's instruction files, where a missed one is a missed requirement.

To opt a repo out, say so in an instruction file the host loads (for example, "`.memory` is retired" or "memory lives in `docs/notes`"). The session prelude and the `/correctionguy` skill yield to that rule, and the reviewer already judges memory by what the instruction files define. A line in a user-level instruction file opts out every repo for that user.

## Requirements

- An [Agent Plugins](https://agent-plugins.org/) client for the portable skills path (Cursor, ChatGPT/Codex, GitHub Copilot, VS Code, Kiro, and others that load the open format) — or **Claude Code** / **Cursor** / **Pi** for the host adapters below
- Codex authenticated — run `codex login` once, or set an API key (needed for the live/stop reviewer hooks on Claude Code, Cursor, and Pi)
- [Bun](https://bun.sh) — only when installing the Claude Code or Cursor hooks

## Install

### Agent Plugins (recommended)

Correction Guy ships as an [Agent Plugins](https://agent-plugins.org/) 1.0.0 package: root `plugin.json` plus portable skills under `skills/`. Install into your agent tools with either:

```sh
npx plugins add correctionguy/correctionguy
```

```sh
bunx plugins add correctionguy/correctionguy
```

Then in a project, run the `setup` skill (`/correctionguy:setup` or your client's equivalent) to lay out `.memory`. Use `/correctionguy` on demand whenever you want the discipline restated; use `/correctionguy:actually` when Correction Guy rooted on a wrong convention.

What you get from the portable core: the on-demand discipline skills and memory setup. Session prelude, live monitor, and stop check are host adapters (below) — clients that only load Agent Plugins ignore those layers.

### Host adapters (hooks)

Use these when you want the sidecar reviews (session prelude, live monitor, stop check), not only the portable skills.

**Claude Code**

```sh
/plugin marketplace add correctionguy/correctionguy
```

```sh
/plugin install correctionguy@correctionguy
```

**Cursor**

Cursor never executes plugin-shipped hooks (they appear under Settings but do not run), so install the hooks directly after the Agent Plugins skills are in place (or instead, if you only want the hook path):

```sh
git clone https://github.com/correctionguy/correctionguy ~/.cursor/correctionguy
cd ~/.cursor/correctionguy && bun install
bun scripts/cursor-install.ts
```

The installer merges Correction Guy's `sessionStart`, `preToolUse`, `postToolUse`, and `stop` entries into `~/.cursor/hooks.json` with absolute paths and preserves everything else in that file; re-running it always converges. Update later with `git pull` in the same folder, then re-run the installer so new hook entries land. The [Cursor Marketplace](https://cursor.com/marketplace) plugin still provides the skills and `/cursor-setup`, which walks the agent through these exact steps.

Cursor injects hook context where the running generation never reads it, so live-monitor corrections would otherwise sit unread until the next turn. The `preToolUse` hook fixes that: when a review flags the session, Correction Guy holds the very next tool call and delivers the correction through the denial message, which the agent reads immediately. The correction still lands in conversation context as well, so installs that have not re-run the installer keep the older next-turn delivery instead of losing corrections. Note that Cursor launches hooks with a constructed environment, not your shell's, so `CORRECTIONGUY_*` variables exported in your shell do not reach the reviews there; defaults apply. Cursor's User Rules live in Cursor settings, not on disk, so the reviewer judges instruction files there against `.cursor/rules` and AGENTS.md only.

**Pi**

```sh
pi install git:github.com/correctionguy/correctionguy
```

Or try it for a single run with `pi -e git:github.com/correctionguy/correctionguy`.

Pi loads the skills from the package manifest and exposes them as `/skill:correctionguy`, `/skill:actually`, and `/skill:setup`.

## Configuration

Everything is tuned through `CORRECTIONGUY_*` environment variables — model, reasoning effort, review cadence, and a `CORRECTIONGUY_YOLO` switch that drops the read-only sandbox for the reviews. Defaults live in `scripts/codex.ts`. You're going to ask an agent to do it, so I'm not going to write it out here 😏

On a host with [tokenmaxxing](https://github.com/anaclumos/tokenmaxxing) pooling your Codex logins, the Claude Code and Cursor reviews draw from the pool instead of the one ambient login: each review borrows a usable pooled account (`tokenmaxxing seat --codex`) for its own run and passes its store as `CODEX_HOME`, so a maxed-out ambient account no longer silences Correction Guy. The borrow needs `tokenmaxxing` on the hook process's `PATH`; when it is not there, or no pooled account is usable, the review runs on the ambient login as before. `CORRECTIONGUY_TOKENMAXXING=0` keeps the ambient login. Pi keeps the ambient login by default, because a borrow keyed to its long-lived process would pin one pooled account for the whole chat; `CORRECTIONGUY_TOKENMAXXING=1` opts in.

Licensed under [MIT](LICENSE).
