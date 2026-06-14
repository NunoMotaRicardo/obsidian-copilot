# runtime-manager

Status: **partial** — extraction + plugin-managed `bin/` resolution shipped (#13). The logic
now lives in `src/runtimeManager.ts` (`resolveDefaultCliPath`, `cleanEnv`), extracted from
`src/copilot.ts`. Tracked by #2, sliced into: extraction + plugin-managed `bin/` resolution
(#13, done), registry download with build-time version pinning + Download/Update/Remove UI
(#14), post-connect version/protocol check + mismatch notice (#15).

## Module API (`src/runtimeManager.ts`)

- `resolveDefaultCliPath(ctx?: RuntimeManagerContext): Promise<ResolvedCliPath>` — walks the
  resolution chain below (excluding the explicit settings path, which the caller
  short-circuits) and returns `{path, source}` where `source` is one of
  `'global-npm' | 'winget' | 'plugin-managed' | 'js-fallback'`.
- `RuntimeManagerContext` carries `pluginBinDir?: string` — the absolute plugin-managed `bin/`
  directory, supplied by the caller (not derived from `__dirname`).
- `ResolvedCliPath = {path: string; source: CliPathSource}` where `CliPathSource` also includes
  `'settings'` (used by `CopilotService` when an explicit `copilotLocation` is set).
- `cleanEnv(): Record<string, string>` — allowlisted subprocess environment (unchanged).

`CopilotService` (`src/copilot.ts`) is the only `@github/copilot-sdk` consumer: it accepts an
optional `pluginBinDir` constructor option, calls `resolveDefaultCliPath` when no explicit
`copilotLocation` is set, caches the `ResolvedCliPath`, and exposes
`resolveCliPath(): Promise<ResolvedCliPath | undefined>` (undefined in remote mode) for the
settings UI. `src/main.ts` computes `pluginBinDir` from the vault adapter `basePath` + vault
`configDir` + `manifest.id` and threads it in.

## Responsibilities

1. **Resolve** the Copilot CLI binary, in priority order:
   1. Explicit path from settings (`copilotLocation`, when non-empty). Handled today in
      `CopilotService.createClient()`; runtime-manager owns the rest of the chain.
   2. Global npm prefix: `%APPDATA%\npm\node_modules\@github\copilot-<platform>-<arch>\copilot(.exe)`
      (also nested under `@github/copilot/node_modules/...`), plus a `__dirname/node_modules`
      search root (vestigial in a bundled plugin, but preserved).
   3. WinGet Links (Windows only):
      `%LOCALAPPDATA%\Microsoft\WinGet\Links\copilot.exe`.
   4. **Plugin-managed fallback binary** at
      `<vault>/.obsidian/plugins/sidekick/bin/copilot(.exe)` (see below), if present — the
      home for a future downloaded runtime (#14). The bin directory is resolved from the vault
      config dir via Obsidian APIs and passed into runtime-manager, not derived from
      `__dirname`.
   5. JS CLI entry point fallback (`@github/copilot/index.js` under `__dirname`); failing
      that, an actionable error (offer download, or `npm i -g @github/copilot`).
2. **Fallback download** (the "Both, bundled as fallback" decision — #14):
   - Download the platform package tarball directly from the npm registry — no npm needed:
     `https://registry.npmjs.org/@github/copilot-<platform>-<arch>/-/copilot-<platform>-<arch>-<version>.tgz`
   - Version: the exact version the installed SDK depends on
     (`node_modules/@github/copilot-sdk/package.json` → `dependencies["@github/copilot"]`,
     resolved at build time into a constant).
   - Use Obsidian `requestUrl` for the HTTP fetch; gunzip + untar with Node `zlib` and a
     minimal tar reader (single file extraction); write to
     `<vault>/.obsidian/plugins/sidekick/bin/copilot(.exe)`; `chmod +x` on POSIX.
   - Settings UI: show resolved source + version; buttons **Download runtime** /
     **Update runtime** / **Remove**.

3. **Version / protocol check** (#15):
   - After connect, `client.getStatus()` → log CLI version + protocol.
   - On connect failure or protocol mismatch (SDK protocol v3), show a notice naming the
     found binary and suggesting `copilot update` or the built-in download.

## Settings surface

- **#13 (this slice):** the Copilot client tab, local mode, gains a read-only line showing
  the **resolved binary path** currently in use (and ideally which step of the chain it came
  from). No buttons yet. Lives alongside the existing **Path** / **Use logged-in user** /
  **GitHub token** settings in `src/settings.ts` (local-mode branch).
- **#14:** adds the resolved version and **Download runtime** / **Update runtime** / **Remove**
  buttons.

## Invariants

- runtime-manager touches only `node:*` builtins and Obsidian APIs — it does **not** import
  `@github/copilot-sdk`. `CopilotService` stays the sole SDK consumer and calls into
  runtime-manager for path resolution.
- The plugin-managed `bin/` directory is resolved from the vault config dir (via Obsidian
  APIs / manifest id) and passed in, not derived from `__dirname` — keeps it testable and
  correct under a real vault layout.
- Download writes to a temp file then renames; a failed download never leaves a partial or
  corrupt binary in `bin/`. Extracted entry names are validated against path traversal.

## Non-goals

- Auto-updating the system CLI.
- Mobile support (plugin is desktop-only; runtime spawn requires Node).
