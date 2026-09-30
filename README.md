<img src="images/logo.jpg" alt="Correction Guy" width="200" align="right">

A second pair of eyes for your coding agent. Correction Guy watches from the sidelines and steers the work back on track. It never touches the work itself. Packaged as an [Agent Plugins](https://agent-plugins.org/) 1.0.0 plugin (portable skills in `skills/` behind root `plugin.json`) with host adapters for **Claude Code** and **Pi**.

An agent grading its own work is the weakest check there is. It is biased toward declaring victory: it papers over stubs, asserts things it never verified, asks permission instead of delivering, and never checks what it changed. A sharper self-prompt doesn't fix this. The agent is still inside its own story.

So Correction Guy hands the review to someone else. A different model (Codex, through the [Codex SDK](https://developers.openai.com/codex/sdk/), no other plugin required) reads the session as an outsider, with no stake in the agent's narrative, and calls out what the agent talked itself past. It is deliberately narrow: it flags six failures, and it raises naming, formatting, and structure only when your own recorded taste names them. It steps in at the moments that matter: as work begins, each time you send a prompt, while work is underway, and the instant the agent tries to call it done.

- **Unverified assumption**: builds on a guess about the system instead of checking it in the workspace.
- **Missed requirement**: leaves out behavior the instruction requires: the user's ask to its end gate (a fix that is fixed, a release that is released) and whatever the instruction files the host loads require.
- **Integration error**: right idea, wired into the surrounding system incorrectly.
- **Regression**: breaks existing behavior while making the change.
- **Wrong file**: delivers the change somewhere the running application never calls, such as a one-off script.
- **No reviews**: never reviewed nor verified what it changed, programmatically (tests, a smoke run) or empirically (a reviewer agent, when the project defines one).

## What it does

- **Session prelude**: sets expectations up front: recall memory and taste, restate the task, then the six failures to avoid.
- **Taste judge**: each prompt you send starts a background pass that judges whether the prompt shows a clear, durable taste of yours (how you like work to look, read, or be built) and records it in `.taste`, one file per taste. Your prompt never waits on it.
- **Live monitor**: every few tool batches, an outside pass catches the six failures before they compound, flags work that breaks a recorded taste, and points out where the work can go further along one.
- **Stop check**: when the agent tries to stop, the reviewer can block a premature "done" (a missed requirement, a stub, an unrun test, a fix that is still a proposal) and feed the correction back. It also nudges on a broken taste or a chance to go further along one. A non-blocking nudge repeats at most once per 30 minutes per session; a block is never held back. Once a review fails (a usage limit, a capacity error, an oversize context, or malformed JSON), the taste judge, the live monitor, and the stop check stay quiet for the rest of the session instead of paying that failure on every prompt and stop; the next session start (a new session, a resume, or a compaction) turns them back on.
- **On-demand**: the `correctionguy` skill (`/correctionguy`) restates the discipline whenever you want it.
- **Actually**: `/correctionguy:actually` is user-triggered when Correction Guy rooted on an old, outdated, or wrong convention: the agent records the override in `.memory` and applies it from then on.
- **Setup**: the `correctionguy:setup` skill lays out `.memory`, folds the agent's native memory in behind a symlink, and fans out subagents across every past session on the repo to mine durable learnings into memory and your taste into `.taste`.

The review prompts, and the corrections that come back, are written in compressed "caveman" style to save tokens.

## Memory

Memory belongs with the code it describes. Correction Guy keeps the agent's memory in a project-local `.memory` folder, so it lives alongside the work instead of in a global store, and it treats facts you state about the project as sourced: recorded, trusted, and never second-guessed for lacking a citation. The folder is git-tracked and travels with the repo, so it holds public knowledge only: treat it like a public Wikipedia page, and keep device, Slack, and environment details out of it. The reviewer reads it as workspace truth: a session that contradicts what is written there is an unverified assumption, and a recorded claim is never flagged as unsourced. Rules about what to record there belong in your project's instruction files, where a missed one is a missed requirement.

To opt a repo out, say so in an instruction file the host loads (for example, "`.memory` is retired" or "memory lives in `docs/notes`"). The session prelude and the `/correctionguy` skill yield to that rule, and the reviewer already judges memory by what the instruction files define. A line in a user-level instruction file opts out every repo for that user.

## Taste

Taste is what you like or reject in how work looks, reads, or is built: code shape, design, naming, writing voice, tools, and product direction. Correction Guy records it from your own prompts into a project-local `.taste` folder, one file per taste, and rewrites a file when a later prompt refines or contradicts it. The agent reads the folder at session start, and the reviewer holds the work to it. `.taste` is git-tracked like `.memory` and keeps the same public bar. To opt a repo out, say so in an instruction file the host loads (for example, "`.taste` is retired").

## Requirements

- An [Agent Plugins](https://agent-plugins.org/) client for the portable skills path (ChatGPT/Codex, GitHub Copilot, VS Code, Kiro, and others that load the open format), or **Claude Code** / **Pi** for the host adapters below
- Codex authenticated: run `codex login` once, or set an API key (needed for the live/stop reviewer hooks on Claude Code and Pi)
- [Bun](https://bun.sh), only when installing the Claude Code hooks

## Install

### Agent Plugins (recommended)

Correction Guy ships as an [Agent Plugins](https://agent-plugins.org/) 1.0.0 package: root `plugin.json` plus portable skills under `skills/`. Agent Plugins leaves installation to each client. Install `correctionguy/correctionguy` through your client's plugin install flow; the [compatible clients](https://agent-plugins.org/compatible-clients) page links each client's setup instructions.

Then in a project, run the `setup` skill (`/correctionguy:setup` or your client's equivalent) to lay out `.memory`. Use `/correctionguy` on demand whenever you want the discipline restated; use `/correctionguy:actually` when Correction Guy rooted on a wrong convention.

What you get from the portable core: the on-demand discipline skills and memory setup. Session prelude, taste judge, live monitor, and stop check are host adapters (below). Clients that only load Agent Plugins ignore those layers.

### Host adapters (hooks)

Use these when you want the sidecar reviews (session prelude, taste judge, live monitor, stop check), not only the portable skills.

**Claude Code**

```sh
/plugin marketplace add correctionguy/correctionguy
```

```sh
/plugin install correctionguy@correctionguy
```

**Pi**

```sh
pi install git:github.com/correctionguy/correctionguy
```

Or try it for a single run with `pi -e git:github.com/correctionguy/correctionguy`.

Pi loads the skills from the package manifest and exposes them as `/skill:correctionguy`, `/skill:actually`, and `/skill:setup`.

## Configuration

Everything is tuned through `CORRECTIONGUY_*` environment variables: model, reasoning effort, review cadence, and a `CORRECTIONGUY_YOLO` switch that drops the read-only sandbox for the reviews. Defaults live in `scripts/codex.ts`. You're going to ask an agent to do it, so I'm not going to write it out here 😏

On a host with [tokenmaxxing](https://github.com/anaclumos/tokenmaxxing) pooling your Codex logins, the Claude Code reviews draw from the pool instead of the one ambient login: each review borrows a usable pooled account (`tokenmaxxing seat --codex`) for its own run and passes its store as `CODEX_HOME`, so a maxed-out ambient account no longer silences Correction Guy. The borrow needs `tokenmaxxing` on the hook process's `PATH`; when it is not there, or no pooled account is usable, the review runs on the ambient login as before. `CORRECTIONGUY_TOKENMAXXING=0` keeps the ambient login. Pi keeps the ambient login by default, because a borrow keyed to its long-lived process would pin one pooled account for the whole chat; `CORRECTIONGUY_TOKENMAXXING=1` opts in.

Licensed under [MIT](LICENSE).
