# Token and data storage

**Scoring area:** Security (96/100)

## What graders look for
Secrets encrypted or tightly access-controlled; least privilege on the database.

## Where your project stands
Supabase tables have row-level security enabled and no client policies, so only the service key can read them. The README warns never to ship the secret key to the frontend. Locally, tokens go to `backend/data/tokens.json`, which is git-ignored.

## Gap
Refresh tokens are stored in plain text in both modes. Local JSON files are created with default permissions.

## What to do
1. Encrypt `refresh_token` with AES-256-GCM using a `TOKEN_ENC_KEY` env var before storing.
2. Write local data files with mode `0o600`.
3. Add a `DELETE /api/disconnect` that revokes the token at Google and deletes the row.
