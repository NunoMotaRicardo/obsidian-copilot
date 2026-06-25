# chat-view

Source: `src/sidekickView.ts` (panel shell, session orchestration) plus `src/view/*`:

| File | Role |
|---|---|
| `configToolbar.ts` | Agent / model / reasoning-effort / skills / tools / working-dir / debug controls |
| `inputArea.ts` | Message input, slash-command prompts, attachments, vault scope button |
| `chatRenderer.ts` | Markdown rendering of messages, reasoning blocks, tool-call details |
| `sessionSidebar.ts` | Session list, restore (cold resume via `getEvents()`), rename/delete, background sessions |
| `searchPanel.ts` | AI vault search tab (basic/advanced) |
| `triggersPanel.ts` | Triggers tab (status, history) |
| `sessionConfig.ts` | Builds `SessionConfig` from selected agent/skills/tools/settings |

Modals (`src/modals/*`): tool approval, elicitation forms, user input (ask_user), edit modal,
vault scope, folder tree.

## Behavior contracts

- Streaming: sessions are created with `streaming: true`; renderer accumulates
  `assistant.message_delta` / `assistant.reasoning_delta`, finalizes on `assistant.message`.
- Reasoning menu (brain icon) shows only when the selected model reports
  `capabilities.supports.reasoningEffort` and a non-empty `supportedReasoningEfforts`; an
  unsupported persisted level resets to `''`.
  - Effort levels are iterated from `supportedReasoningEfforts` and stored as a free string
    (`settings.reasoningEffort`), because models report values beyond the SDK's
    `ReasoningEffort` union (e.g. `max`, `none`). `none` is labelled "Off"; `''` = model
    default. Re-selecting the active level toggles back to `''`.
  - A **Reasoning summary** submenu (gated on the same capability) sets
    `settings.reasoningSummary` to `''` (model default), `none`, `concise`, or `detailed`.
    `none` suppresses reasoning output, so no reasoning block is rendered (the block is only
    ever created from reasoning events).
  - Both values are passed together on every mid-session `session.setModel()` call so neither
    resets, and flow into new sessions via `sessionConfig` in `sidekickView.ts` and
    `bots/telegramBot.ts`. The SDK-boundary cast to `ReasoningEffort`/`ReasoningSummary` is
    localized (the unions lag the values models actually report).
  - A **Long context** toggle in the same menu pins the session to the SDK's
    `long_context` context-window tier (`settings.contextTier`, `'default' | 'long_context'`,
    default `'default'`). Unlike reasoning effort there is **no per-model support signal** —
    `ModelCapabilities.supports` exposes only `vision` and `reasoningEffort`, and `ModelInfo`
    has no long-context flag (only `limits.max_context_window_tokens`). The toggle is
    therefore always shown (the menu shows it even for models that don't support reasoning
    effort, so the model icon stays interactive); the SDK silently ignores `contextTier` for
    models that don't support the tier. `contextTier` rides along on the same mid-session
    `session.setModel()` call (`{reasoningEffort, reasoningSummary, contextTier}`) so toggling
    it doesn't reset reasoning, is omitted from session config when 'default' (matching the
    reasoning omit-when-empty pattern), and flows into new/resumed sessions via buildSessionConfig
    and into the Telegram bot via TelegramBotService.buildBotSessionConfig. `ContextTier` is imported from `../copilot`
    (CopilotService's SDK re-export). Orthogonal to infinite sessions (issue #5): context tier
    sets the window size, infinite sessions controls auto-compaction — they compose.
  - An **Infinite sessions** toggle in the same model-icon menu controls the SDK's
    auto-compaction behavior (`settings.infiniteSessionsEnabled`, default `true` — the SDK
    default). When enabled, the SDK compacts the conversation at ~80% context utilization
    (background) and blocks at ~95% (buffer exhaustion). When disabled, sessions hit the
    context limit and stop. The toggle follows the same patterns as Long context: always shown,
    sets a persisted setting, marks config dirty, omitted from session config when `true`
    (matching the SDK default). `infiniteSessions: { enabled: false }` is passed only when
    the user explicitly disables it. Planned: issue #5.
- **Compaction events in debug view** (issue #5): when the debug toggle is on,
  `session.compaction_start` and `session.compaction_complete` events render inline debug
  blocks in the chat (same visibility gating as tool calls via `.sidekick-hide-debug`).
  `compaction_start` shows the pre-compaction token breakdown (conversation / system / tool
  definition tokens). `compaction_complete` shows success/failure, tokens removed, messages
  removed, and the summary content. These are handled in `handleSessionEvent()` alongside
  existing event types.
- Session restore: resume by id with the full current session config, re-select agent via
  `session.rpc.agent.select`, replay history from `session.getEvents()`
  (`user.message`, `assistant.reasoning`, `assistant.message`).
- The active note is attached as context; working directory follows the active note's folder
  unless overridden in the toolbar. Planned: auto-resolve and attach note-embedded images
  (`![[image.png]]`, `![](path.png)`) as SDK file attachments up to a configurable cap (default
  3), gated by `settings.autoIncludeNoteImages` and `settings.maxNoteImages`, respecting SDK
  `model.capabilities.limits.vision.max_prompt_images` when reported (issue #27).
- Image attachments: the input area supports drag/drop (OS and vault files), clipboard paste
  (screenshot to blob), and the paperclip attachment button. `buildSdkAttachments()` in
  `sessionConfig.ts` converts `ChatAttachment` items to SDK format using a hybrid strategy:
  on-disk files as `{type: 'file', path}`, clipboard pastes as `{type: 'blob', data, mimeType}`.
  Planned: end-to-end verification with vision-capable Ollama model (issue #26).
- Sessions are auto-named `<Agent>: <first message>`; trigger/search sessions are tagged.
