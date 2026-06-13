---
id: 7
title: Reasoning effort — handle model-reported values beyond the SDK union
status: done
type: bug
spec: chat-view
created: 2026-06-12
github: https://github.com/NunoMotaRicardo/obsidian-copilot/issues/7
---

# Reasoning effort: model-reported values beyond the SDK union

Verified 2026-06-12 against CLI 1.0.60: models now report effort values outside
`ReasoningEffort = "low"|"medium"|"high"|"xhigh"` — e.g. claude-sonnet-4.6 reports
`low/medium/high/max`, gpt-5.4 reports `none/low/medium/high/xhigh`.

The toolbar menu (`src/view/configToolbar.ts`) iterates `model.supportedReasoningEfforts`
directly, so `max`/`none` are selectable and work at runtime — but only by accident:

- `settings.reasoningEffort` is typed `'' | 'low' | 'medium' | 'high' | 'xhigh'`
  (`src/settings.ts:52`), so `'max'` is stored through an unchecked assignment.
- Casts like `level as ReasoningEffort` paper over the mismatch.

## Changes

- [x] Widen the persisted type to `string` (empty = model default) and drop the casts;
      validity is already enforced against `model.supportedReasoningEfforts` at render time.
- [x] Label mapping for `none` ("Off") and `max` in the menu/badge.
- [x] Same handling in `telegramBot.ts` and `sidekickView.ts` pass-throughs.

## Implementation notes

- `settings.reasoningEffort` widened to `string`. `'' ` (omit field = model default) and
  `none` (explicitly sent) are kept distinct — agreed with the user 2026-06-13. Re-selecting
  the active level toggles back to `''`.
- Menu/badge logic in `configToolbar.ts` now reads `supportedReasoningEfforts` as `string[]`,
  so the internal `as ReasoningEffort` casts are gone. `effortLabel()` maps `none`→"Off",
  others Title-case (`max`→"Max").
- The SDK still narrows `reasoningEffort` on `setModel`/`SessionConfig`, so a single
  cast survives at each SDK boundary (`reasoningSetModelOptions` in `configToolbar.ts`, and the
  session-config builders in `sidekickView.ts` / `bots/telegramBot.ts`), with a comment noting
  the SDK union lags runtime values.

## Verification log

- 2026-06-13: `tsc -noEmit` + eslint clean; production build (`npm run build`) succeeds;
  deployed to the vault and `obsidian plugin:reload id=sidekick` loaded without error.
- Pending manual check: open the chat brain menu with claude-sonnet-4.6 (expect `Max`) and
  gpt-5.4 (expect `Off`/`Max`); confirm selecting `max` persists and reaches the model.
