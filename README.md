# Correction Guy

![Correction Guy](images/logo.jpg)

A second pair of eyes for your coding agent. Correction Guy watches from the sidelines and steers the work back on track — it never touches the work itself.

Works in **Claude Code** and **Cursor**.

## Why

An agent grading its own work is the weakest check there is. It is biased toward declaring victory: it papers over stubs, asserts things it never verified, asks permission instead of delivering, and forgets what it just learned. A sharper self-prompt doesn't fix this — the agent is still inside its own story.

So Correction Guy hands the review to someone else. A different model (Codex, through the [Codex SDK](https://developers.openai.com/codex/sdk/) — no other plugin required) reads the session as an outsider, with no stake in the agent's narrative, and calls out what the agent talked itself past. It is deliberately narrow: it flags real failures — wrong scope, stubs, unsourced claims, ignored test failures, abandoned work, drift, a to-do list or memory gone stale — and stays quiet on taste like naming, formatting, and structure. It steps in at the three moments that matter: as work begins, while it is underway, and the instant the agent tries to call it done.

## What it does

- **Session prelude** — sets expectations up front: restate the task, check memory, keep the to-do list and session title honest, verify third-party behavior, finish the work, run the code.
- **Live monitor** — every few tool batches, an outside pass catches drift, bad assumptions, stale to-dos, and contradicted memory before they compound.
- **Stop check** — when the agent tries to stop, the reviewer can block a premature "done" — a stub, abandoned work, ignored feedback, an unrun build — and feed the correction back.
- **On-demand** — `/correctionguy` restates the discipline whenever you want it.

The review prompts, and the corrections that come back, are written in compressed "caveman" style to save tokens.

## Memory

Memory belongs with the code it describes. Correction Guy keeps the agent's memory in a project-local `.memory` folder, so it lives alongside the work instead of in a global store, and it treats facts you state about the project as sourced — recorded, trusted, and never second-guessed for lacking a citation. The reviewer flags when a session contradicts what is written there, or learns something worth keeping and never writes it down.

## Requirements

- [Bun](https://bun.sh)
- Codex authenticated — run `codex login` once, or set an API key.
- **Claude Code** or **Cursor**

## Install

**Claude Code**

```sh
/plugin marketplace add correctionguy/correctionguy
/plugin install correctionguy@correctionguy
```

**Cursor** — install from the [Cursor Marketplace](https://cursor.com/marketplace), or [test locally](https://cursor.com/docs/plugins#test-plugins-locally) from a checkout.

## Configuration

Everything is tuned through `CORRECTIONGUY_*` environment variables — model, reasoning effort, review cadence, and a `CORRECTIONGUY_YOLO` switch that drops the read-only sandbox for the reviews. Defaults live in `scripts/codex.ts`.

Licensed under [MIT](LICENSE).
