# Thoughtful error handling

**Scoring area:** Code Quality (84)

## Why this earns a high score
Errors are caught, translated into helpful messages and never crash the server.

## Evidence in your project
- `wrap()` in `index.js` catches async route errors and returns JSON `{ error }` with status 500.
- `friendlyDriveError` turns raw Google errors into speakable guidance (API not enabled, permission box not ticked, expired connection).
- `gen()` retries on 500/503, backs off, falls back to a second model and gives clear messages for 404 and 429.
- `/api/send` handles `invalid_grant` with 401 and a reconnect message; a failed history save does not undo a sent email (it logs a warning).

## Takeaway
Failure paths are designed, not accidental.
