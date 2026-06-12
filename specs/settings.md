# settings

Source: `src/settings.ts` — settings interface, defaults, and the settings tab UI.

## Groups

- **GitHub Copilot Client** — type (Local CLI / Remote CLI), CLI path, remote URL,
  use-logged-in-user, GitHub token, **Test** button. Runtime-manager additions (issue 0002):
  resolved-binary display, download/update fallback runtime.
- **Models** — provider picker (GitHub built-in or BYOK: OpenAI, Azure/Foundry, Anthropic,
  Ollama, Foundry Local, other), base URL, model name, API key / bearer, wire API
  (completions/responses). BYOK flows into `SessionConfigBase.provider` and a custom
  `onListModels` handler in `main.ts`.
- **Sidekick** — inline-operations model, sidekick folder name, tools approval (allow/ask),
  ghost-text toggle, reasoning effort (`'' | low | medium | high | xhigh`), search mode/agent.
  Planned: reasoning summary (0003), long-context default (0004), infinite sessions (0005).
- **Bots** — Telegram bot config (token stored via `localStorage`, not `data.json`).
- **MCP input variables** — stored values for `${input:...}` placeholders; passwords kept in
  localStorage only.

## Invariants

- Secrets (tokens, password inputs) never land in `data.json`.
- `reasoningEffort: ''` means "model default" — never send the empty string to the SDK.
- Settings changes that affect an active session mark the session config dirty; a new or
  reconfigured session picks them up.
