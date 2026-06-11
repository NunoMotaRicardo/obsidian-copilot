# runtime-manager

Status: **planned** (issue 0002). Today the logic lives as free functions in `src/copilot.ts`
(`resolveDefaultCliPath`, `cleanEnv`). This module extracts and extends it.

## Responsibilities

1. **Resolve** the Copilot CLI binary, in priority order:
   1. Explicit path from settings (`copilotCliPath`).
   2. Global npm prefix: `%APPDATA%\npm\node_modules\@github\copilot-<platform>-<arch>\copilot(.exe)`
      (also nested under `@github/copilot/node_modules/...`).
   3. WinGet links: `%LOCALAPPDATA%\Microsoft\WinGet\Links\copilot.exe`.
   4. **Plugin-managed fallback binary** (see below), if previously downloaded.
   5. Fail with a actionable error (offer download, or `npm i -g @github/copilot`).

2. **Fallback download** (the "Both, bundled as fallback" decision):
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

3. **Version / protocol check**:
   - After connect, `client.getStatus()` → log CLI version + protocol.
   - On connect failure or protocol mismatch (SDK protocol v3), show a notice naming the
     found binary and suggesting `copilot update` or the built-in download.

## Non-goals

- Auto-updating the system CLI.
- Mobile support (plugin is desktop-only; runtime spawn requires Node).
