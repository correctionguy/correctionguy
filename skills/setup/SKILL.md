---
name: setup
description: "Set up Correction Guy in a repo: lay out .memory, merge the agent's native memory behind a symlink, mine every past conversation into memory with fanned-out subagents."
---

# Correction Guy setup

Establishes the memory layout Correction Guy expects, then back-fills `.memory` from every past conversation on this project. Run when `.memory` is missing or still gitignored, the traditional memory dir holds real files or points wrong, or the user asks to set up Correction Guy or re-learn the repo. Idempotent: re-running merges, never duplicates.

## 1. Lay out `.memory`

- Project root = `git rev-parse --show-toplevel`; not a git repo -> cwd.
- `<root>/.memory` is itself a symlink (the historical inversion) -> materialize before anything else: note the target, remove the symlink, `mkdir .memory`, copy the target's files — including dotfiles — into it. Never proceed with `.memory` as a symlink; step 2's merge branch would otherwise delete the only copy and loop the links.
- Create `<root>/.memory/` if missing.
- `.memory` is git-tracked and committed with the repo (owner rule, 2026-07-20; supersedes the earlier gitignore-and-never-commit rule); its files commit with normal work. `.gitignore` lists `.memory` -> the folder was private until now: review every existing `.memory` file against the public bar below and scrub non-public details first, then delete the line so the folder tracks.
- Because `.memory` is public, it holds public knowledge only: treat it like a public Wikipedia page. Never record device info, Slack info (conversation, user, workspace, or channel details), or environment info (`.env` keys, local machine paths or file listings).
- `<root>/.memory/MEMORY.md` = index only: one line per memory, `- [Title](file.md) — hook`. Create if missing. Memory content never goes in the index.

## 2. Symlink the traditional dir into it

Traditional memory dir = `~/.claude/projects/<slug>/memory`, where slug = project absolute path with every non-alphanumeric character replaced by `-` (confirm with `ls ~/.claude/projects | grep -i <basename>`). Direction always: real files live in `.memory`, the traditional path is the symlink — never the reverse.

- Already a symlink resolving to `<root>/.memory` -> done.
- Path absent but `~/.claude/projects/<slug>` exists -> `ln -s <root>/.memory ~/.claude/projects/<slug>/memory`.
- Symlink elsewhere -> repoint with `ln -sfn` (plain `-sf` follows a symlink-to-dir and drops the new link inside the old target).
- Real directory -> merge every file including dotfiles into `.memory` (same name on both sides: keep the `.memory` file, fold in any fact the other copy has that it lacks). Its `MEMORY.md`: index-shaped lines merge into the index; freeform memory content -> file each fact as its own `.memory/*.md` with its own index line, never drop it. The public bar from step 1 applies to everything merged in: the traditional dir was written under no such rule, so scrub device, Slack, and environment details on the way in (keep the lesson, drop the non-public specifics). Then remove the emptied dir and `ln -s <root>/.memory ~/.claude/projects/<slug>/memory`.
- `~/.claude/projects/<slug>` itself missing (Claude Code never ran here) -> skip this step and step 3; step 1 still stands.
- Verify before moving on: `readlink ~/.claude/projects/<slug>/memory` resolves to `<root>/.memory` and the real files sit there. Traditional path still a real dir (leftover files blocked removal, `ln` nested the link inside) -> fix now.

## 3. Triage, then mine

Conversations = top-level `*.jsonl` files in `~/.claude/projects/<slug>/` (subdirectories hold agent sidecars — skip them). Fan out one subagent per transcript (Workflow tool `agent()` with per-call `model`, else Agent tool with `model`); transcripts in the hundreds -> run every stage, triage included, in waves. Two stages, cheap first:

**Triage** — `sonnet`, one per transcript. Skim user turns and assistant `text` blocks; grade the transcript's signal:

- `high`: owner corrections, assumptions exposed as wrong, hard-won discoveries.
- `low`: routine work, thin durable signal.
- `none`: trivial or empty session.

Return the grade plus pointers to the hot spots (topics, rough position in file).

**Mine** — `none` -> skip. `low` -> `sonnet`. `high` -> escalate fast: `opus`, or top tier when the triager flags dense or subtle signal. Miner gets the transcript path plus the triage pointers, and:

- File is JSONL, one JSON object per line; skip any line that fails parse. Read user turns and assistant `text` blocks under `message.content[]`; skip tool dumps. Huge file -> extract with `jq`/grep slices, never read the whole raw file.
- Hunt high-entropy learnings only — lessons a fresh agent could NOT re-derive from the codebase, git history, AGENTS.md, or docs: owner corrections, assumptions that turned out wrong (record the wrong assumption AND the correction), stated preferences, owner-stated project facts (User's Claims), external gotchas (API/CLI/platform behavior learned the hard way).
- Skip task-local detail, anything readable from the repo, secrets, and anything non-public (device info, Slack conversation/user/workspace/channel details, environment info): `.memory` is git-tracked, public-Wikipedia bar.
- Return per learning: the fact, why it matters, how to apply it, type (`user` | `feedback` | `project` | `reference`), and its date — `user`/`assistant` message lines carry a `timestamp` field (other line types may not); report the latest relevant one so the consolidator can break contradictions.

Hundreds of transcripts -> run miners in waves and pass the consolidator only each wave's learnings, never raw transcript text.

## 4. Consolidate

Judgment work — main thread or a top-tier stage, never a scan tier.

- Merge miner output; dedupe across miners AND against every existing `.memory` file.
- Hold the entropy bar: fresh agent could re-derive it from the repo in five minutes -> drop it. Keep the historic lessons the repo cannot show.
- Genuinely new fact -> one file per fact in `.memory`, shape below, plus its index line in `MEMORY.md`.
- Existing memory contradicted by a newer session -> the later timestamp wins: update that file in place, don't fork a duplicate. Never delete a User's Claim for lacking a link.
- Frontmatter `name` = file basename minus `.md`; `[[links]]` and index entries resolve by filename.

```markdown
---
name: <short-kebab-slug>
description: <one line, used to judge recall relevance>
metadata:
  type: user | feedback | project | reference
---

<the fact; for feedback/project add **Why:** and **How to apply:** lines. Link related memories with [[their-name]].>
```

## 5. Report

Glanceable bullets, no wall: layout actions taken, transcripts mined and skipped, memories written, updated, already covered.

## Sources

- Transcript location `~/.claude/projects/<slug>/<uuid>.jsonl`: the `transcript_path` examples in https://code.claude.com/docs/en/hooks.md. Slug shape (non-alphanumeric -> `-`) is observed behavior — always confirm with `ls ~/.claude/projects`.
- Per-stage model routing ("Every agent in a workflow uses your session's model unless the script routes a stage to a different one"): https://code.claude.com/docs/en/workflows
- `ln -sfn` for repointing (`-n`/`-h` treats a symlink-to-dir target as the link itself instead of descending into it): https://www.gnu.org/software/coreutils/manual/html_node/ln-invocation.html (GNU `-n`), https://github.com/apple-oss-distributions/file_cmds/blob/main/ln/ln.c#L106-L108 (macOS: `-n` is an alias of `-h`)
