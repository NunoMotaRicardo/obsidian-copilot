# settings

Source: `src/settings.ts` — settings interface, defaults, and the settings tab UI.

## Groups

- **GitHub Copilot Client** — type (Local CLI / Remote CLI), CLI path, remote URL,
  use-logged-in-user, GitHub token, **Test** button. Runtime-manager additions:
  resolved-binary source/path display (#13), **Download** / **Update** / **Remove** fallback
  runtime buttons (#14).
- **Models** — provider picker (GitHub built-in or BYOK: OpenAI, Azure/Foundry, Anthropic,
  Ollama, Foundry Local, other), base URL, model name, API key / bearer, wire API
  (completions/responses). BYOK flows into `SessionConfigBase.provider` and a custom
  `onListModels` handler in `main.ts`.
- **Sidekick** — inline-operations model, sidekick folder name, tools approval (allow/ask),
  ghost-text toggle, inline Sidekick icon toggle (`inlineIconEnabled`, default off — gutter
  icon next to the active line, issue 0008), reasoning effort (`string`, `''` = model default;
  validated against the model's `supportedReasoningEfforts`), reasoning summary
  (`'' | none | concise | detailed`), search mode/agent. Both reasoning controls live in the
  chat toolbar's brain menu, not a settings-tab field. Planned: long-context default (0004),
  infinite sessions (0005).
- **Bots** — Telegram bot config (token stored via `localStorage`, not `data.json`).
- **MCP input variables** — stored values for `${input:...}` placeholders; passwords kept in
  localStorage only.

## Invariants

- Secrets (tokens, password inputs) never land in `data.json`.
- `reasoningEffort: ''` / `reasoningSummary: ''` mean "model default" — never send the empty
  string to the SDK; the field is omitted from the session config instead.
- Settings changes that affect an active session mark the session config dirty; a new or
  reconfigured session picks them up.
