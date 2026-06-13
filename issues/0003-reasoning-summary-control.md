---
id: 3
title: Reasoning summary control
status: done
type: feature
spec: chat-view
created: 2026-06-12
github: https://github.com/NunoMotaRicardo/obsidian-copilot/issues/3
---

# Reasoning summary control

SDK 1.0 adds `SessionConfigBase.reasoningSummary` (type `ReasoningSummary` from
`generated/session-events`). Expose it next to the existing reasoning-effort control.

- [x] Inspect the `ReasoningSummary` union in the SDK types and map values to UI labels.
      Union is `none | concise | detailed`; labelled Title-case, plus "Model default" (`''`).
- [x] Setting (`settings.ts`) + brain-menu entry (`view/configToolbar.ts`), only when the
      model supports reasoning.
- [x] Pass through session-config builds; respect "model default" when unset.
- [x] Chat renderer: when summaries are suppressed, hide the reasoning block cleanly.

## Implementation notes

- `settings.reasoningSummary: string` (`''` = model default) added to `SidekickSettings`
  and `DEFAULT_SETTINGS`. `ReasoningSummary` re-exported from `src/copilot.ts`.
- Control is a **Reasoning summary** submenu in the brain menu (`configToolbar.ts`), gated on
  the same `capabilities.supports.reasoningEffort` flag as effort (the SDK has no separate
  `supports.reasoningSummary` capability). Options: Model default / None / Concise / Detailed.
- Mid-session changes call `session.setModel()` with effort **and** summary together
  (`reasoningSetModelOptions`) so neither resets. New sessions pick it up via the session-config
  builders in `sidekickView.ts` and `bots/telegramBot.ts`. Note: the reasoning config is built
  inline in those two files, not in `view/sessionConfig.ts` (which only maps MCP/attachments).
- Suppression: no renderer change needed. The reasoning block is only ever created from
  `assistant.reasoning_delta` / `assistant.reasoning` events; with `summary = none` the model
  emits none, so no (empty) block appears. Decision recorded with the user 2026-06-13.

## Verification log

- 2026-06-13: `tsc -noEmit` + eslint clean; production build (`npm run build`) succeeds;
  deployed to the vault and `obsidian plugin:reload id=sidekick` loaded without error.
- Pending manual check: open the chat brain menu on a reasoning model, set **Reasoning
  summary → None** and confirm the reasoning block stops appearing; set **Concise/Detailed**
  and confirm summaries return.
