# Pluggable persistence layer

**Scoring area:** Code Quality (84)

## Why this earns a high score
One interface with two interchangeable backends shows good abstraction.

## Evidence in your project
- `store.js` exposes the same functions (`save`, `load`, `listContacts`, `saveContact`, `findContact`, `getEmailHistory`, `saveEmailHistory`) with Supabase or local JSON underneath.
- The app works with zero setup (JSON files) and scales up to Supabase.
- `scripts/migrate-local-to-supabase.js` and `importLocal()` move data between the two.

## Takeaway
Flexible design that also respects the project's free-tier goal.
