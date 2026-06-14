---
id: 8
title: Remove the sidekick icon that appears embedded in the document
status: done
type: feature
spec: editor
created: 2026-06-13
github: https://github.com/NunoMotaRicardo/obsidian-copilot/issues/8
---

# Remove the sidekick icon that appears embedded in the document

The ghost-text gutter marker showed a Sidekick icon next to the active line/selection,
which ruined formatting for some note layouts. Made optional and off by default; Sidekick
actions remain available via the right-click menu (`editor/editorMenu.ts`).

- [x] `settings.ts`: new `inlineIconEnabled: boolean` (default `false`) in
      `SidekickSettings`/`DEFAULT_SETTINGS`.
- [x] Settings → Sidekick → Capabilities → **Show inline Sidekick icon** toggle.
- [x] `editor/ghostText.ts`: gutter marker (`lineMarker`) returns `null` when
      `inlineIconEnabled` is false; no change to context-menu actions.
- [x] Spec/docs: `specs/editor.md` + README inline-edits section updated.

## Verification log

- 2026-06-13: `tsc -noEmit` + eslint clean; `npm run build` succeeds; deployed to the vault
  and `obsidian plugin:reload id=sidekick` loaded without error.
- 2026-06-13: re-verified during specs review (`specs/settings.md`, `specs/copilot-service.md`,
  `specs/bots-triggers.md` brought in sync with done issues 0003/0007/0008): production build
  clean, deployed to `obsidian-configs` vault, reload OK, `dev:errors` clean, and
  `settings.inlineIconEnabled` reads `false` via `obsidian eval`.
