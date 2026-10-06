# Release

- A release runs in this order: bump the three manifests, push `main` and wait for its CI run to pass, `git tag -a vX.Y.Z -m "vX.Y.Z: <summary>"` and push the tag, then `gh release create vX.Y.Z --title "vX.Y.Z" --notes "..."`. No npm publish exists
- Claude Code installs pick a release up through `claude plugin update correctionguy@correctionguy`; the bare name `correctionguy` errors "not found". Pi installs pull the git source
