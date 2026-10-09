# Database tests with a mock Supabase

**Scoring area:** Testing (79)

## Why this earns a high score
Testing persistence without an external service.

## Evidence in your project
- `supabase.test.mjs` implements a small PostgREST-like mock (filters, ordering, selected columns).
- Tests: token save/load round trip, contacts upsert and search, history newest first per recipient, health explaining a missing table, importing local data into Supabase.

## Takeaway
Both persistence paths are exercised offline and repeatably.
