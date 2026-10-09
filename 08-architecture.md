# Project structure and separation of concerns

**Scoring area:** Code Quality (84/100)

## What graders look for
Clear layers (routes / services / data), no business logic inside UI or route handlers.

## Where your project stands
Good separation exists: `gmail.js` (Google mail), `drive.js` (Drive), `gemini.js` (LLM), `store.js` (persistence), `dialog.js` (conversation logic, separate from React), `emailNormalize.js` (pure functions). `Dialog` accepts an injected `api`, which makes it testable.

## Gap
`index.js` mixes routing, validation and orchestration (e.g. send then save history). `store.js` mixes two persistence backends in each function.

## What to do
1. Introduce a `StoreBackend` interface with `FileStore` and `SupabaseStore` classes, chosen once at startup, so each function has no `if (sb)` branch.
2. Move the send-then-save-history orchestration into `services/mail.js`.
3. Add a short architecture diagram to the README.
