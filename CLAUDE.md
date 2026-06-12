# obsidian-copilot (Sidekick fork)

Personal fork of obsidian-sidekick: an Obsidian desktop plugin embedding GitHub Copilot as an
assistant (chat panel, editor actions, ghost text, triggers, Telegram bot). Upstream is
unmaintained; this fork tracks the GA Copilot SDK.

## Stack & build

- TypeScript (strict) → single `main.js` via esbuild. Node/Electron APIs allowed (desktop-only).
- `npm run build` = `tsc -noEmit -skipLibCheck` + production bundle. `npm run dev` = watch.
- `npm run lint` (eslint + eslint-plugin-obsidianmd).
- Key dependency: `@github/copilot-sdk` (1.x, GA). It talks JSON-RPC to a system-installed
  `copilot` CLI (SDK protocol v3; CLI must be ≥ ~1.0.5x). SDK type reference lives in
  `node_modules/@github/copilot-sdk/dist/*.d.ts` — read those before guessing API shapes,
  and see `.claude/skills/copilot-sdk-reference/`.

## Architecture

Read `specs/00-architecture.md` first; one spec per module in `specs/`. Rules:

- **All SDK access goes through `CopilotService` (`src/copilot.ts`).** Other modules import
  SDK types only via its re-exports.
- `src/main.ts` stays lifecycle-only. UI in `src/view/*` + `src/modals/*`, editor features in
  `src/editor/*`, vault config parsing in `src/configLoader.ts`.
- Update the matching spec in the same change that alters module behavior.

## Workflow

- Work items are markdown files in `issues/` with YAML frontmatter
  (`status: open | in-progress | done`). Follow `.claude/skills/issue-workflow/`.
- Verify changes with `.claude/skills/deploy-test/`: build → copy artifacts to
  `D:\nmr-obsidian\obsidian-configs\.obsidian\plugins\sidekick\` → reload
  (`obsidian plugin:reload id=sidekick`). That vault is the user's real vault — deploy only
  builds that compile clean.
- Releases (BRAT): `.claude/skills/release/`. Tag = `manifest.json` version, no `v` prefix.

## Conventions

- Tabs for indentation, single quotes, no trailing semicolon omission — match existing files.
- Secrets never go in `data.json` (use localStorage paths already established in settings).
- Register all listeners/intervals through Obsidian `register*` helpers so unload is clean.
- Obsidian UI copy: sentence case, **bold** for literal labels, arrows for navigation.
