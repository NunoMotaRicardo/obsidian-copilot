# editor

Source: `src/editor/editorMenu.ts`, `src/editor/ghostText.ts`, `src/modals/editModal.ts`.

## Context-menu actions (`editorMenu.ts`)

Right-click → Sidekick. With a selection: Edit (modal), Rewrite, Proofread, Use synonyms,
Minor/Major revise, Describe, Answer, Explain, Expand, Summarize, Chat with sidekick,
Autocomplete toggle. Without: Edit the note, Structure and refine, Chat, Autocomplete.
File/folder explorer menu: note edit, folder summary note, image extraction/mermaid.

- Quick actions replace text in place using the **inline operations model** via
  `CopilotService.chat()` (ephemeral session, `approveAll`).
- The Edit modal offers task/tone/format/length/choices controls and N alternatives.

## Ghost text (`ghostText.ts`)

CodeMirror 6 extension; debounced completion requests through `CopilotService.chat()` with
the inline operations model. Tab accepts, Escape dismisses. Enabled via settings toggle.
The inline Sidekick gutter icon is controlled separately by the **Show inline Sidekick icon**
setting (off by default).

## Constraints

- Inline paths must stay fast: no skills, no MCP servers, minimal system prompt.
- Never write to the note until the user accepts (modal pick or ghost-text accept).
