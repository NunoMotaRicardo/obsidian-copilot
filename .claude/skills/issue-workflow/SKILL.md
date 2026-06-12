---
name: issue-workflow
description: How to create, progress, and close work items in the issues/ folder. Use when starting implementation work, filing a bug or feature, or updating issue status.
---

# Issue workflow

Work items are markdown files in `issues/`, named `NNNN-kebab-title.md` (zero-padded, next
number = highest existing + 1). No subfolders; status lives in frontmatter so files never move.

## Frontmatter

```yaml
---
id: 7
title: Short imperative title
status: open        # open | in-progress | done
type: feature       # feature | bug
spec: chat-view     # specs/<name>.md the work belongs to
created: 2026-06-12
---
```

## Body

- Problem/context paragraph (link the spec and any upstream references).
- `- [ ]` checklist of concrete changes, file paths included.
- `## Verification log` section — append dated results when deploy-test passes/fails.

## Rules

- Set `status: in-progress` when starting, `done` only after verification in the vault
  (deploy-test skill) and the checklist is complete.
- One issue per coherent change; spin off discoveries into new issues instead of scope-creep.
- When behavior changes, update the matching `specs/*.md` in the same change.
- Find work: `grep -l "status: open" issues/`.
