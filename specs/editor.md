# editor

Source: `src/editor/editorMenu.ts`.

## Context-menu actions (`editorMenu.ts`)

The editor context menu adds exactly one top-level plugin action: **Copilot edit** with
selected text, or **Copilot insert** with no selection. A small instruction prompt opens;
Apply replaces the captured selection or inserts at the captured cursor position.
If the note changes or the editor closes during generation, reject the result with a notice
rather than replacing unrelated content. There is no advanced edit form or sidebar edit button.
File/folder explorer menu: note edit, folder summary note, image extraction/mermaid.

Image-specific actions remain available in the file explorer only. The editor action
does not change when the cursor is on an image embed.

- Quick actions replace text in place using the **inline operations model** via
  `CopilotService.chat()` (ephemeral session, `approveAll`). When a BYOK provider is active,
  `chat()` and `inlineChat()` auto-inject the `provider` config (type, baseUrl, apiKey,
  bearerToken, wireApi) and `streaming` flag, so inline actions work with non-GitHub providers
  (Ollama, Foundry Local, OpenAI, Azure, Anthropic, etc.) without any additional wiring (#25).
- Edit and insert use `inlineChat()` through the shared permission-aware prompt helper.
- Autocomplete and its CodeMirror extension, settings, commands, and gutter have been removed.

## Constraints

- Inline paths must stay fast: no skills, no MCP servers, minimal system prompt.
- Never write to the note until the user submits an instruction.
