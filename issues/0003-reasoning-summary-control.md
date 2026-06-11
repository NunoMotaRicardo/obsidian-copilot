---
id: 3
title: Reasoning summary control
status: open
type: feature
spec: chat-view
created: 2026-06-12
github: https://github.com/NunoMotaRicardo/obsidian-copilot/issues/3
---

# Reasoning summary control

SDK 1.0 adds `SessionConfigBase.reasoningSummary` (type `ReasoningSummary` from
`generated/session-events`). Expose it next to the existing reasoning-effort control.

- [ ] Inspect the `ReasoningSummary` union in the SDK types and map values to UI labels.
- [ ] Setting (`settings.ts`) + brain-menu entry (`view/configToolbar.ts`), only when the
      model supports reasoning.
- [ ] Pass through `sessionConfig.ts` builds; respect "model default" when unset.
- [ ] Chat renderer: when summaries are suppressed, hide the reasoning block cleanly.
