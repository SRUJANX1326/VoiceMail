# Indexed and limited database queries

**Scoring area:** Efficiency (80)

## Why this earns a high score
Queries stay fast as data grows.

## Evidence in your project
- `email_history` has a composite index on `(device_id, recipient_email, created_at desc)` matching the query pattern.
- `getEmailHistory` uses `.limit(10)` and orders newest first.
- `contacts` uses a composite primary key `(device_id, email)` which makes upserts efficient.

## Takeaway
Schema designed around the actual access patterns.
