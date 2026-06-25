# copilot-service

Source: `src/copilot.ts` — class `CopilotService`. The single place the plugin touches
`@github/copilot-sdk`. Every other module goes through this wrapper.

## Responsibilities

- Own one `CopilotClient` and its lifecycle (`ensureConnected`, `stop`).
- Create / resume / list / delete sessions with plugin-wide defaults (`clientName: 'obsidian-sidekick'`).
- One-shot helpers: `chat()` (ephemeral session) and `inlineChat()` (persisted session) used by
  editor actions, ghost text, search, triggers, and bots.
- Re-export all SDK types consumed elsewhere so the SDK import surface stays in one file.

## SDK 1.0 contract (post-migration)

- Client construction uses `connection`:
  - Local: `RuntimeConnection.forStdio({ path })` where `path` comes from runtime-manager
    resolution (settings override → global npm → WinGet links → SDK fallback).
  - Remote: `RuntimeConnection.forUri(url)`.
- Auth: `gitHubToken` (capital H) and `useLoggedInUser` client options.
- Environment: pass the allowlisted `cleanEnv()` and `workingDirectory: os.homedir()`.
- Connection state: the SDK no longer exposes `getState()`/`ConnectionState`. The service
  tracks its own `ConnectionState` (`disconnected | connecting | connected | error`) — set
  around `start()` — and keeps exposing `getState()` to the rest of the plugin.
- On `start()` failure, the error surfaced to the UI must mention the likely cause
  (CLI missing or too old → "run `copilot update`").
- `ping()` returns `timestamp: string` (ISO), optionally `protocolVersion`.
- Message history: `session.getEvents()` (was `getMessages()`).
- MCP config types: `MCPServerConfig = MCPStdioServerConfig | MCPHTTPServerConfig`.

## Session options passed through (selected)

| Option | Source |
|---|---|
| `model` | toolbar / agent frontmatter / settings |
| `reasoningEffort` | settings + toolbar brain menu, only when `model.capabilities.supports.reasoningEffort` |
| `reasoningSummary` | settings + toolbar brain menu (issue 0003), same gating as `reasoningEffort` |
| `contextTier` | planned — issue 0004 |
| `infiniteSessions` | settings `infiniteSessionsEnabled` (issue #5) — `{ enabled }` config; omitted when `true` (SDK default), passed as `{ enabled: false }` when disabled |
| `systemMessage` | agent body / built-in prompts |
| `customAgents`, `agent` | config-loader agents |
| `mcpServers` | config-loader `tools/mcp.json` |
| `skillDirectories`, `disabledSkills` | config-loader skills |
| `onPermissionRequest` | tool-approval modal or `approveAll` |
| `onUserInputRequest`, `onElicitationRequest` | modals |
| `provider` | BYOK settings |

## Version info callback (#15)

After a successful connect in `ensureConnected()`, the service calls `client.getStatus()`
fire-and-forget (try/catch — must not block or break the connect path). If it succeeds, the
service caches the `GetStatusResponse` and fires the `onVersionInfo` constructor callback:

```
onVersionInfo?: (status: {version: string; protocolVersion: number}, resolvedPath: string) => void
```

This follows the same constructor callback pattern as `onListModels`. `main.ts` wires it to
log `Sidekick: Copilot CLI v%s (protocol %d)` to console. The settings UI reads the cached
version info from the service (`getVersionInfo()`) to display it alongside the resolved
binary path.

The SDK already checks protocol mismatch during `client.start()` and throws — so there is no
separate mismatch Notice on successful connect. `getStatus()` is purely informational.

## Ollama connection error handling

Planned: hybrid connection error notice for the `ollama` preset (issue #25). When a connection
error occurs during `session.send()` or `chat()`/`inlineChat()` with `providerPreset === 'ollama'`,
catch the network error and show an actionable Obsidian Notice: "Could not reach Ollama at
localhost:11434. Is it running? Start it with `ollama serve`." Text-only — no retry button, no
auto-retry. The existing Settings > Models **Test** button is the manual retry path. Planned:
broader Ollama UX polish including capability detection (issue #30).

## Invariants

- No other module imports `@github/copilot-sdk` directly (modals import types only — keep
  type-only imports acceptable).
- `stop()` is called from plugin `onunload()`; must not throw.
- All public methods call `ensureConnected()` first; a broken client is recreated, never reused.
