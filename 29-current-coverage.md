# What the test suite covers today

**Scoring area:** Testing (79/100)

## What graders look for
Presence of meaningful automated tests, passing, with a clear command.

## Where your project stands
I ran both suites: backend 21 passing, frontend 39 passing, 0 failures (60 total) using the built-in `node --test`. Coverage includes drive file validation, Supabase store behaviour (mocked), dialog flows, email normalisation, and voice helpers. Test files: `backend/test/{backend,drive,supabase}.test.mjs`, `frontend/test/{dialog,drive,normalize,voice}.test.mjs`.

## Gap
No coverage number is produced, there is no root-level `npm test`, and the README does not mention counts or results.

## What to do
1. Add a root `package.json` script `"test": "npm --prefix backend test && npm --prefix frontend test"`.
2. Print coverage with `node --test --experimental-test-coverage` and paste the table into the README.
3. Add a badge or a "Test results" section.
