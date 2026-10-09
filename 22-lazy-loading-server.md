# Lazy loading on the server

**Scoring area:** Efficiency (80)

## Why this earns a high score
Do not pay for features you are not using.

## Evidence in your project
- `store.js` imports `@supabase/supabase-js` with `await import(...)` only when `SUPABASE_URL` and `SUPABASE_KEY` are set.
- Local-file mode therefore starts without loading the database client.

## Takeaway
Lower startup cost for the default configuration.
