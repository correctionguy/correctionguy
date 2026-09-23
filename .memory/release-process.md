---
name: release-process
description: Bump three manifests in lockstep, annotated tag, GitHub-only release, no npm publish
metadata:
  type: project
---

1. Bump the version in `plugin.json`, `package.json`, and `.claude-plugin/plugin.json` together; `bun run validate` fails on a mismatch.
2. Run `bun run check`, `bun run typecheck`, and `bun run validate`. The commit gate also runs the metered smoke test.
3. Commit in conventional-commits style with a detailed body and no attribution trailer.
4. Push `main`.
5. Annotated tag: `git tag -a vX.Y.Z -m "vX.Y.Z: <summary>"`, then push the tag.
6. `gh release create vX.Y.Z --title "vX.Y.Z" --notes "..."`.

There is no npm publish. Claude Code installs pick a release up through `claude plugin update correctionguy@correctionguy`; the bare name errors "not found". Pi installs pull the git source. See [[codex-sdk-version-gates-new-models]].
