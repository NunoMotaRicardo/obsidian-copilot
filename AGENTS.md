# Copilot repository instructions

This repository is the source for Copilot, an Obsidian Community Plugin by Nuno Ricardo that brings GitHub Copilot and BYOK AI providers into Obsidian through a configurable sidebar, editor actions, triggers, search, and optional bot integrations. Keep the existing `sidekick` plugin id, settings keys, and vault customization folder for compatibility.

## Core expectations

- Treat this as an Obsidian plugin first. Prefer Obsidian APIs, existing DOM patterns, and small focused modules over framework-heavy solutions.
- Use the existing npm toolchain. Build with `npm run build`, lint with `npm run lint`, and use `npm run dev` for watch mode.
- Keep runtime dependencies minimal and compatible with the Obsidian plugin environment.
- Do not commit generated artifacts or assume `main.js` is the source of truth. Source lives under `src/`.

## Architectural boundaries

- Keep `src/main.ts` small and focused on plugin lifecycle, settings bootstrapping, view registration, and top-level command wiring.
- Put Copilot SDK, CLI resolution, provider wiring, reconnect logic, and session bridge behavior in `src/copilot.ts` rather than scattering that logic across UI files.
- Keep vault-local customization parsing in `src/configLoader.ts`. If the change affects agents, skills, prompts, triggers, or MCP configuration loading, update the parser and types deliberately.
- Keep translation from Obsidian state into SDK session config, attachments, and MCP server mappings in `src/view/sessionConfig.ts`.
- Keep persisted plugin settings and secret handling in `src/settings.ts`.
- Prefer adding focused modules under `src/view/`, `src/modals/`, `src/editor/`, or `src/bots/` instead of growing monolithic files.

## Sidekick customization model

- Sidekick runtime customizations are vault-local and rooted at `settings.sidekickFolder`, which defaults to `sidekick/`.
- Preserve the current layout and semantics unless the task is explicitly about changing them: `agents/*.agent.md`, `prompts/*.prompt.md`, `skills/<name>/SKILL.md`, `tools/mcp.json`, and `triggers/*.trigger.md`.
- Do not imply that VS Code or GitHub Copilot customization files such as `.github/copilot-instructions.md`, `*.instructions.md`, `.prompt.md`, or `.agent.md` are automatically loaded by the plugin runtime. They are repository authoring aids unless the code explicitly imports or translates them.
- When changing customization formats, keep backward compatibility in mind for existing frontmatter and JSON shapes.

## Settings, safety, and privacy

- Keep defaults sensible and stable. Avoid renaming command ids, settings keys, or configuration fields without a migration path.
- Persist secrets through the existing secure local-storage helpers instead of writing tokens or API keys into plugin data.
- Default to local-first behavior. New network access, remote execution, or third-party integrations must be user-visible, justified, and documented.
- Respect Obsidian plugin cleanup requirements. Use `register*` helpers and avoid leaking listeners, intervals, or view state across reloads.

## UI and editor work

- Match the current Obsidian-native UI style instead of introducing a separate component framework.
- Keep user-facing copy concise, clear, and in sentence case.
- For editor features, rely on Obsidian's CodeMirror runtime and preserve the externalized CodeMirror dependency model.

## Development workflow

- Repository authoring aids live under `.agents/` (the `sidekick-coder` agent plus skills such as `sidekick-build`, `sidekick-lite`, `sidekick-pr-review`, `deploy-test`, and `release`). They are for developing this plugin, not part of the Sidekick runtime.
- Technical contracts live in `specs/` (start at `specs/00-architecture.md`); product decisions and guides live in `wiki/`. Work items are GitHub issues on `NunoMotaRicardo/obsidian-copilot`.
- There is no automated test runner. Verify with `npm run build`, `npm run lint`, and the `deploy-test` skill.
- Deploy development builds only to `C:\dev\obsidian-test-vault\.obsidian\plugins\sidekick\`, never to a personal or production vault. Copy `main.js`, `manifest.json`, and `styles.css` only after a successful build and lint.
- Target the test vault explicitly in every Obsidian CLI command: `obsidian vault="obsidian-test-vault" plugin:reload id=sidekick`. Check `dev:errors` and inspect the changed UI or behavior in that same vault. If the CLI is unavailable, report that verification needs a manual reload; do not silently target another vault.
- On Windows, if the CLI is not on PATH, use `& 'C:\Program Files\Obsidian\Obsidian.com' vault="obsidian-test-vault" ...`.
- The editor context menu adds only **Copilot edit** when text is selected or **Copilot insert** at the cursor otherwise. There is no autocomplete, gutter action button, sidebar edit button, or advanced edit form.
- Use `copilot/<slug>` branch names and never merge PRs automatically.

## Documentation expectations

- Update `README.md` or the relevant docs file when a change affects setup, configuration, supported providers, customization behavior, or user workflows.
- For documentation about customization, clearly distinguish between repository/editor customization files and Sidekick's own vault-local runtime configuration.
