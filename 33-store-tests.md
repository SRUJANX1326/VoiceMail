# Persistence layer tests (file mode)

**Scoring area:** Testing (79/100)

## What graders look for
Both storage backends are verified.

## Where your project stands
`supabase.test.mjs` (9 tests) covers the Supabase path with a mock. The file-backed path (the default, without Supabase) has less coverage even though README promises it works.

## Gap
Contact upsert, duplicate email handling, 500-item history cap, and corrupted JSON recovery are untested.

## What to do
1. Point `store.js` at a temp `DATA_DIR` env var for tests.
2. Test `saveContact` twice with the same email updates, not duplicates.
3. Test history is capped at 500 and `getEmailHistory` returns newest first.
