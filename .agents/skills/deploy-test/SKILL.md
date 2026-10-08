---
name: deploy-test
description: Build the plugin and deploy it to the user's Obsidian vault for verification. Use after code changes to verify them in the real app, or when asked to deploy, test, or reload the plugin.
---

# Deploy & test the plugin

Target vault (isolated development vault — never deploy to the user's real vault or deploy a build that didn't compile clean):

```
C:\dev\obsidian-test-vault\.obsidian\plugins\sidekick\
```

## Steps

1. Build: `npm run build` (runs tsc typecheck, then esbuild production bundle producing
   `main.js` at the repo root). Stop and report on any error.
2. Lint: `npm run lint`. Stop and report on any error.
3. Copy artifacts (create the plugin directory if missing):
   ```powershell
   New-Item -ItemType Directory -Force 'C:\dev\obsidian-test-vault\.obsidian\plugins\sidekick\' | Out-Null
   Copy-Item main.js, manifest.json, styles.css 'C:\dev\obsidian-test-vault\.obsidian\plugins\sidekick\' -Force
   ```
4. Reload the plugin (Obsidian CLI, works while Obsidian is running). Always specify the test vault, never rely on the focused vault:
   ```powershell
   obsidian vault="obsidian-test-vault" plugin:reload id=sidekick
   obsidian vault="obsidian-test-vault" dev:errors
   ```
   If the `obsidian` CLI is unavailable, tell the user to reload manually
   (**Settings → Community plugins** toggle, or Ctrl+R).
   On this Windows machine, if `obsidian` is not on PATH, use
   `& 'C:\Program Files\Obsidian\Obsidian.com' vault="obsidian-test-vault" plugin:reload id=sidekick`
   (and the same executable and vault parameter for all other CLI commands).
5. Verify behavior relevant to the change in the test vault. For Copilot connectivity: open the Copilot panel,
   check the model dropdown populates and a short chat streams. Console errors show in the
   Obsidian developer console (Ctrl+Shift+I) prefixed `[sidekick]`.
   For editor UI changes, inspect both selection states: **Copilot edit** replaces selected text; **Copilot insert** inserts at the cursor. Confirm the sidebar has no edit button and settings/menus/commands have no autocomplete feature.
6. Record the result in the active issue's "Verification log" section if an issue is associated with the task.
