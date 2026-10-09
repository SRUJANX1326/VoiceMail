# HTTP-level route tests

**Scoring area:** Testing (79)

## Why this earns a high score
Tests that hit real endpoints catch wiring errors.

## Evidence in your project
- `backend.test.mjs` starts the server and calls it with `fetch`: `/api/status`, `/api/send`, `/api/draft`, OAuth redirect.
- `drive.test.mjs` checks `GET /api/drive/files`, `POST /api/drive/upload`, `GET /api/drive/check` and that the consent URL requests both `gmail.send` and `drive.file`.

## Takeaway
Routes, status codes and scopes are verified end to end.
