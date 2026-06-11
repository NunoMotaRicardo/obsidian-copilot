---
id: 4
title: Long-context tier toggle
status: open
type: feature
spec: chat-view
created: 2026-06-12
---

# Long-context tier toggle

SDK 1.0 adds `SessionConfigBase.contextTier: "default" | "long_context"`.

- [ ] Determine model support signal from `ModelInfo` (capabilities/limits) before showing UI.
- [ ] Toggle in the model dropdown (chat toolbar); persisted setting for default behavior.
- [ ] Pass through session creation/resume; document interaction with infinite sessions.
