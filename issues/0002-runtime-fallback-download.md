---
id: 2
title: Runtime manager — fallback CLI download from npm registry
status: open
type: feature
spec: runtime-manager
created: 2026-06-12
---

# Runtime manager with fallback download

Extract CLI resolution out of `src/copilot.ts` into `src/runtimeManager.ts` and add a
plugin-managed fallback when no system CLI is found.

Per [specs/runtime-manager.md](../specs/runtime-manager.md):

- [ ] Extract `resolveDefaultCliPath` + `cleanEnv` into the new module; add the
      plugin-managed binary (`.obsidian/plugins/sidekick/bin/`) to the resolution chain.
- [ ] Download platform tarball `@github/copilot-<platform>-<arch>` directly from
      registry.npmjs.org (Obsidian `requestUrl`), gunzip via `node:zlib`, minimal tar
      extraction of the single binary, `chmod +x` on POSIX.
- [ ] Pin version to the SDK's `@github/copilot` dependency (resolved at build time).
- [ ] Settings UI: show resolved binary source/version; Download / Update / Remove buttons.
- [ ] Post-connect `getStatus()` version+protocol logging; friendly mismatch notice.
