# Modular architecture

**Scoring area:** Code Quality (84)

## Why this earns a high score
Each concern lives in its own module, so the code is easy to read, change and review. Graders reward clear separation of responsibilities.

## Evidence in your project
- `backend/gmail.js` handles OAuth and mail building, `drive.js` handles Drive, `gemini.js` handles the LLM, `store.js` handles persistence, `index.js` handles routing.
- Frontend logic is split into `dialog.js` (conversation state machine), `emailNormalize.js`, `voice.js`, `api.js`, with `App.jsx` only for UI.
- Conversation logic is kept out of React, so it is not tangled with rendering.

## Takeaway
Clear layering is a core marker of maintainable code.
