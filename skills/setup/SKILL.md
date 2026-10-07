---
name: setup
description: "Set up Correction Guy in a repo: lay out .memory, merge the agent's native memory behind a symlink, mine every past conversation into memory and taste with fanned-out subagents."
---

# Correction Guy setup

Establishes the memory layout Correction Guy expects, then back-fills `.memory` and `.taste` from every past conversation on this project. Run when `.memory` is missing or still gitignored, the traditional memory dir holds real files or points wrong, or the user asks to set up Correction Guy or re-learn the repo. Idempotent: re-running merges, never duplicates.

## 1. Lay out `.memory`

- Project root = `git rev-parse --show-toplevel`; not a git repo -> cwd.
- `<root>/.memory` is itself a symlink (the historical inversion) -> materialize before anything else: note the target, remove the symlink, `mkdir .memory`, copy the target's files, including dotfiles, into it. Never proceed with `.memory` as a symlink; step 2's merge branch would otherwise delete the only copy and loop the links.
- Create `<root>/.memory/` if missing.
- `.memory` is git-tracked and committed with the repo; its files commit with normal work. `.gitignore` lists `.memory` -> the folder was private until now: review every existing `.memory` file against the public bar below and scrub non-public details first, then delete the line so the folder tracks.
- Because `.memory` is public, it holds public knowledge only: treat it like a public Wikipedia page. Never record device info, Slack info (conversation, user, workspace, or channel details), or environment info (secret values, local machine paths or file listings). A secret is a value with a token shape (an API key, token, password, or private key string), whatever variable holds it; a variable name alone, such as `CORRECTIONGUY_*`, is public.
- `<root>/.memory/MEMORY.md` follows the [Agent Memory Repo](https://github.com/AgentMemoryRepo/agentmemoryrepo) format: it starts with `# Memory: <project>`, holds the few entries every session needs, then `## Index` listing every other file as `- [[file]]`. Create `# Memory: <project>` plus an empty `## Index` if missing. A `[[file]]` link is a path from `.memory`, without `.md` for a Markdown file.
- `<root>/.taste/` sits beside `.memory`: one file per user taste, no index, same git tracking and public bar. The Correction Guy hooks add to it from each user prompt. An instruction file the host loads retires `.taste` -> skip every taste step below.

## 2. Symlink the host memory dir into it

Host memory dir (Claude Code) = `~/.claude/projects/<slug>/memory`, where slug = the main checkout's absolute path with every non-alphanumeric character replaced by `-` (confirm with `ls ~/.claude/projects | grep -i <basename>`). In a linked worktree (`git worktree add`), `<root>` for this step is the main checkout, `dirname "$(git rev-parse --path-format=absolute --git-common-dir)"`, never the worktree's cwd: the harness maps a worktree's memory to the main checkout's slug, the worktree's own `~/.claude/projects/<worktree slug>/` holds transcripts only, and a `memory` symlink placed there is read by nothing. Direction always: real files live in `.memory`, the host path is the symlink, never the reverse.

- Already a symlink resolving to `<root>/.memory` -> done.
- Path absent but `~/.claude/projects/<slug>` exists -> `ln -s <root>/.memory ~/.claude/projects/<slug>/memory`.
- Symlink elsewhere -> repoint with `ln -sfn` (plain `-sf` follows a symlink-to-dir and drops the new link inside the old target).
- Real directory -> merge every file including dotfiles into `.memory` (same name on both sides: keep the `.memory` file, fold in any fact the other copy has that it lacks). Its `MEMORY.md`: index-shaped lines merge into the `## Index` as `- [[file]]` bullets; freeform memory content -> file each fact as one bullet in the matching snake_case topic file, never drop it. A frontmatter memory file merges in as bullets: drop the frontmatter, keep the body as one-line entries. The public bar from step 1 applies to everything merged in: the traditional dir was written under no such rule, so scrub device, Slack, and environment details on the way in (keep the lesson, drop the non-public specifics). Then remove the emptied dir and `ln -s <root>/.memory ~/.claude/projects/<slug>/memory`.
- `~/.claude/projects/<slug>` itself missing (Claude Code never ran here) -> skip this step and step 3; step 1 still stands.
- Verify before moving on: `readlink ~/.claude/projects/<slug>/memory` resolves to `<root>/.memory` and the real files sit there. Traditional path still a real dir (leftover files blocked removal, `ln` nested the link inside) -> fix now.

## 3. Triage, then mine

Conversations = top-level `*.jsonl` files in `~/.claude/projects/<slug>/` (subdirectories hold agent sidecars; skip them). Fan out one subagent per transcript (Workflow tool `agent()` with per-call `model`, else Agent tool with `model`); transcripts in the hundreds -> run every stage, triage included, in waves. Two stages, cheap first:

**Triage**: `sonnet`, one per transcript. Skim user turns and assistant `text` blocks; grade the transcript's signal:

- `high`: owner corrections, taste statements, assumptions exposed as wrong, hard-won discoveries.
- `low`: routine work, thin durable signal.
- `none`: trivial or empty session.

Return the grade plus pointers to the hot spots (topics, rough position in file).

**Mine**: `none` -> skip. `low` -> `sonnet`. `high` -> escalate fast: `opus`, or top tier when the triager flags dense or subtle signal. Miner gets the transcript path plus the triage pointers, and:

- File is JSONL, one JSON object per line; skip any line that fails parse. Read user turns and assistant `text` blocks under `message.content[]`; skip tool dumps. Huge file -> extract with `jq`/grep slices, never read the whole raw file.
- Hunt high-entropy learnings only: lessons a fresh agent could NOT re-derive from the codebase, git history, AGENTS.md, or docs: owner corrections, assumptions that turned out wrong (record the wrong assumption AND the correction), owner-stated project facts (User's Claims), external gotchas (API/CLI/platform behavior learned the hard way).
- Hunt taste separately, from user turns only: what the user clearly likes or rejects in how work looks, reads, or gets built (code shape, design, UX, naming, writing voice, tools, workflow, product direction), durable past one task. Skip one-off task detail. Return per taste: the preference, what the user rejects, a short quote of the user's words, and its date.
- Skip task-local detail, anything readable from the repo, secret values (token-shaped strings; a variable name alone is public), and anything non-public (device info, Slack conversation/user/workspace/channel details, environment info): `.memory` is git-tracked, public-Wikipedia bar.
- Return per learning: the fact, why it matters, how to apply it, type (`user` | `feedback` | `project` | `reference`), and its date: `user`/`assistant` message lines carry a `timestamp` field (other line types may not); report the latest relevant one so the consolidator can break contradictions.

Hundreds of transcripts -> run miners in waves and pass the consolidator only each wave's learnings, never raw transcript text.

## 4. Consolidate

Judgment work: main thread or a top-tier stage, never a scan tier.

- Merge miner output; dedupe across miners AND against every existing `.memory` file.
- Hold the entropy bar: fresh agent could re-derive it from the repo in five minutes -> drop it. Keep the lessons the repo cannot show.
- Write each memory as one guardrail: the trap, the correct move, and the exact command, flag, path, or error string that makes it actionable, in present tense. No dates, incident narrative, or superseded text; the date breaks contradictions during consolidation and then stays out of the file.
- Genuinely new fact -> one bullet on one line in the snake_case topic file that groups it (`ci.md`, `deploy.md`), shape below. A new topic file gets a `- [[file]]` line in the `## Index` of `MEMORY.md`. An entry every session needs goes in `MEMORY.md` above `## Index`.
- Existing memory contradicted by a newer session -> the later timestamp wins: update that entry in place, don't add a contradicting one. Never delete a User's Claim for lacking a link.
- Memory files carry no frontmatter. A cross-link is `[[path]]` from `.memory`, without `.md` for a Markdown file.

```markdown
- <the trap, the correct move, and the exact command, flag, path, or error string> [source: <pull request or issue URL>]
```

`[source: ...]` is optional trailing metadata, `[key: value; key: value]` when there are several; no entry carries a date.

- Taste -> one file per taste in `.taste`, shape below, deduped against every existing `.taste` file. A later taste that refines or contradicts a recorded one rewrites that file in place.

```markdown
---
name: <short-kebab-slug>
description: <one line>
---

<plain present-tense sentences: what the user wants, what the user rejects, a short quote of the user's words>
```

## 5. Report

Glanceable bullets, no wall: layout actions taken, transcripts mined and skipped, memories written, updated, already covered, tastes written, updated, already covered.

## Sources

- Transcript location `~/.claude/projects/<slug>/<uuid>.jsonl`: the `transcript_path` examples in https://code.claude.com/docs/en/hooks.md. Slug shape (non-alphanumeric -> `-`) is observed behavior; always confirm with `ls ~/.claude/projects`. A linked worktree's memory dir resolving to the main checkout's slug, with only its transcripts under the worktree's own slug, is observed behavior as well: the memory path a session reports from a worktree names the main checkout's slug.
- Per-stage model routing ("Every agent in a workflow uses your session's model unless the script routes a stage to a different one"): https://code.claude.com/docs/en/workflows
- `ln -sfn` for repointing (`-n`/`-h` treats a symlink-to-dir target as the link itself instead of descending into it): https://www.gnu.org/software/coreutils/manual/html_node/ln-invocation.html (GNU `-n`), https://github.com/apple-oss-distributions/file_cmds/blob/main/ln/ln.c#L106-L108 (macOS: `-n` is an alias of `-h`)
