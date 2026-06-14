# runtime-manager

Status: **planned**. Today the logic lives as free functions in `src/copilot.ts`
(`resolveDefaultCliPath`, `cleanEnv`). This module extracts and extends it. Tracked by #2,
sliced into: extraction + plugin-managed `bin/` resolution (#13), registry download with
build-time version pinning + Download/Update/Remove UI (#14), post-connect version/protocol
check + mismatch notice (#15).

## Responsibilities

1. **Resolve** the Copilot CLI binary, in priority order:
   1. Explicit path from settings (`copilotCliPath`).
   2. Global npm prefix: `%APPDATA%\npm\node_modules\@github\copilot-<platform>-<arch>\copilot(.exe)`
      (also nested under `@github/copilot/node_modules/...`).
   4. **Plugin-managed fallback binary** (see below), if previously downloaded.
   5. Fail with an actionable error (offer download, or `npm i -g @github/copilot`).
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
