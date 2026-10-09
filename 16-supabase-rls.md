# Row-level security on every table

**Scoring area:** Security (96)

## Why this earns a high score
Database-level protection is defence in depth.

## Evidence in your project
- `supabase/schema.sql` runs `alter table ... enable row level security` for `google_tokens`, `contacts` and `email_history`.
- No public policies exist; the file comments that only the server's service key accesses them.
- README warns never to use the publishable key or expose the secret key in the frontend.

## Takeaway
Stored tokens and contacts are not readable through the public API.
