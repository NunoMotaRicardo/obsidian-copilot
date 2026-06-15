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
  `onListModels` handler in `main.ts`. For BYOK presets, **Test** fetches the provider's model
  list directly (`fetchProviderModels()` in `src/providerModels.ts`) rather than creating an
  SDK session — see "Models tab: Test / model discovery" below. The `github` preset's Copilot
  tab "Client type" Test button is unchanged (still `createSession` + `ping`/disconnect).
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

## Models tab: Test / model discovery (BYOK presets, issue #19)

For every BYOK preset (`openai`, `azure`, `anthropic`, `ollama`, `foundry-local`,
`other-openai` — everything except `github`), the Models-tab **Test** button performs a
**direct model-list fetch** against the configured provider, via
`fetchProviderModels()` (`src/providerModels.ts`):

- `GET ${baseUrl}/api/tags` for `ollama` (parses `{ models: [{ name, ... }] }`).
- `GET ${baseUrl}/v1/models` for all other BYOK presets (parses `{ data: [{ id, name?, ... }] }`).

`fetchProviderModels()` returns a discriminated result (`ok` + `models: ModelInfo[]`, or an
error) rather than swallowing failures into `[]`, so the Test handler can distinguish the
three outcomes:

- **N > 0 models** — `new Notice('Connected — found N model(s).')`. The returned model
  `id`/`name` pairs populate a `<datalist>` wired to the **Model name** `<input>`.
- **0 models, request succeeded** — `new Notice('Connected, but the provider reported no
  available models.')`. This is the expected steady state for Foundry Local when the service
  is up but no model is loaded. The datalist is cleared (no stale entries from a previous
  Test).
- **Network / auth / parse error** — `new Notice('Test failed: ' + error)`, same wording as
  the existing Copilot-tab Test failure. Datalist is cleared.

The `github` preset's Copilot-tab "Client type" Test button is unchanged: it still calls
`copilot.ping()` (connectivity check), independent of this behavior.

`fetchProviderModels()` is also the basis for `buildOnListModels()`'s `onListModels` callback
(used by `CopilotService` for the inline-operations model dropdown today; the sidebar BYOK
model picker wiring is Phase 2, not yet built — `populateModelSelect()` in
`src/view/configToolbar.ts` still echoes the free-text **Model name** for BYOK).

**Auth headers** (`fetchProviderModels()`, shared by Test and `onListModels`): mirrors the
SDK's `ProviderConfig` precedence — `bearerToken` wins over `apiKey` when both are set — and
uses provider-appropriate header shapes: `api-key` for `azure`, `x-api-key` for `anthropic`,
`Authorization: Bearer <token>` for everything else (`openai`, `ollama`, `foundry-local`,
`other-openai`). This makes a successful Test a reliable (though not 100% guaranteed —
deployment-listing APIs like Azure's can differ) predictor of session auth working.

## Model name field (datalist-backed)

**Model name** remains a free-text `<input>` (never a hard `<select>`) — it must keep working
before the user has ever clicked Test, and for endpoints whose model-listing shape doesn't
match `/v1/models` or `/api/tags` (datalist stays empty, no validation error). After a
successful Test with N > 0 models, an HTML `<datalist>` attached to the input is populated
with the fetched model `id`s (and `name` as the visible label where they differ) so the user
can pick from a dropdown-like list or type any value. The datalist is **in-memory only**
(Settings-tab session state) — not persisted to `data.json`/`localStorage`; it resets to empty
when Settings is reopened until Test is clicked again.

## Invariants

- Secrets (tokens, password inputs) never land in `data.json`.
- `reasoningEffort: ''` / `reasoningSummary: ''` mean "model default" — never send the empty
  string to the SDK; the field is omitted from the session config instead.
- Settings changes that affect an active session mark the session config dirty; a new or
  reconfigured session picks them up.
- All BYOK provider HTTP calls (Test, `onListModels`) go through `fetchProviderModels()`
  (`src/providerModels.ts`) — don't duplicate the `/v1/models` / `/api/tags` fetch-and-parse
  logic inline in `settings.ts` or `main.ts`.
