# Configuration and magic values

**Scoring area:** Code Quality (84/100)

## What graders look for
Config in one place; no unexplained literals; sensible defaults.

## Where your project stands
Env vars are read in many places (`process.env.X` in `gemini.js`, `drive.js`, `gmail.js`, `store.js`, `index.js`). Literals like `100kb`, `4500`, `8000` ms, `slice(-30)`, `slice(-12)`, `-500` have no names. `GEMINI_MODEL` default `gemini-3.8-flash` is repeated in two files.

## Gap
Scattered configuration makes behaviour hard to trace and test.

## What to do
1. Create `backend/config.js` that reads and validates env once and exports a frozen object.
2. Name constants: `MAX_HISTORY_TURNS`, `LIVE_LINE_MS`, `SUPABASE_TIMEOUT_MS`, `MAX_STORED_EMAILS`.
3. Fail fast at startup if `GOOGLE_CLIENT_ID` or `GEMINI_API_KEY` is missing (with a readable message).
