# Backend route (integration) tests

**Scoring area:** Testing (79/100)

## What graders look for
HTTP-level tests for the main endpoints.

## Where your project stands
`backend.test.mjs` has only 7 tests, mostly around helpers. `index.js` calls `app.listen` at import time, which makes it hard to import for route testing.

## Gap
`/api/send`, `/api/chat`, `/api/contacts`, `/auth/callback`, and `/api/drive/upload` have no HTTP-level tests.

## What to do
1. Export `app` from `app.js` and start the server only in `index.js`.
2. Use `node:test` plus `fetch` against `app.listen(0)`, or `supertest`.
3. Cases: invalid recipient returns 400, missing token returns 401, upload of `.env` returns 400, happy path returns `{ok:true}` with mocked Gmail.
