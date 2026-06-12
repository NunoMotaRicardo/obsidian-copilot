---
id: 7
title: Reasoning effort — handle model-reported values beyond the SDK union
status: open
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

- [ ] Widen the persisted type to `string` (empty = model default) and drop the casts;
      validity is already enforced against `model.supportedReasoningEfforts` at render time.
- [ ] Label mapping for `none` ("Off") and `max` in the menu/badge.
- [ ] Same handling in `telegramBot.ts` and `sidekickView.ts` pass-throughs.
