# Database queries and indexes

**Scoring area:** Efficiency (80/100)

## What graders look for
Indexed lookups, bounded results, no N+1.

## Where your project stands
Good: `email_history` has a composite index on `(device_id, recipient_email, created_at desc)`, queries use `limit(10)`, `contacts` has a composite primary key. `health()` uses a timeout.

## Gap
`findContact` loads the full contact list then filters in memory; `/api/contacts/find` then makes a second query for history.

## What to do
1. Use `ilike` filtering in Supabase for contact search.
2. Run contact and history queries in parallel with `Promise.all`.
3. Add an index on `contacts(device_id, name)` if the list grows.
