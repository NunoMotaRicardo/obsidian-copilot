# editor

Source: `src/editor/editorMenu.ts`, `src/editor/ghostText.ts`, `src/modals/editModal.ts`.

## Context-menu actions (`editorMenu.ts`)

Right-click → Sidekick. With a selection: Edit (modal), Rewrite, Proofread, Use synonyms,
Minor/Major revise, Describe, Answer, Explain, Expand, Summarize, Chat with sidekick,
Autocomplete toggle. Without: Edit the note, Structure and refine, Chat, Autocomplete.
File/folder explorer menu: note edit, folder summary note, image extraction/mermaid.

Planned: editor context menu image actions on embeds (issue #28). When the cursor is on a line
containing an image embed (`![[image.png]]` or `![alt](path.png)`), show image-specific actions:
extract text below, convert to Mermaid below, and a new "Ask about image" custom-prompt action
(modal for free-form question, response inserted below the embed). Consolidates with existing
file-explorer image actions (`extractImageContent()`, `convertToMermaidBelow()`) rather than
duplicating.

- Quick actions replace text in place using the **inline operations model** via
  `CopilotService.chat()` (ephemeral session, `approveAll`).
- The Edit modal offers task/tone/format/length/choices controls and N alternatives.

## Ghost text (`ghostText.ts`)

CodeMirror 6 extension; debounced completion requests through `CopilotService.chat()` with
the inline operations model. Tab accepts, Escape dismisses. Enabled via settings toggle.
The inline Sidekick gutter icon is controlled separately by the **Show inline Sidekick icon**
setting (off by default).

Current constants: `DEBOUNCE_MS = 400`, `MIN_LINE_CHARS = 3`, `CONTEXT_LINES = 30`,
`MAX_CONTEXT_CHARS = 2000`. Planned: tuning for local model latency (issue #29) — local models
(Ollama) are slower than cloud APIs, so debounce may need to increase and context may need to
shrink. May also need model-specific or provider-specific defaults rather than hardcoded values.

## Constraints

- Inline paths must stay fast: no skills, no MCP servers, minimal system prompt.
- Never write to the note until the user accepts (modal pick or ghost-text accept).
