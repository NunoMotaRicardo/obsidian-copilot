---
id: 5
title: Infinite sessions / auto-compaction setting
status: open
type: feature
spec: chat-view
created: 2026-06-12
github: https://github.com/NunoMotaRicardo/obsidian-copilot/issues/5
---

# Infinite sessions / auto-compaction

SDK 1.0 enables infinite sessions by default (background compaction at 80% context,
blocking at 95%). Make this visible and controllable.

- [ ] Setting: enable/disable (`infiniteSessions: { enabled }`); advanced thresholds optional.
- [ ] Debug view: surface compaction-related session events so long chats aren't silently
      compacted without trace.
- [ ] Verify trigger/bot sessions inherit the same behavior.
