# Secret-management design

**Scoring area:** Security (96)

## Why this earns a high score
Keys are meant to live in the environment, never in code.

## Evidence in your project
- All keys are read from `process.env` (`GEMINI_API_KEY`, `GOOGLE_CLIENT_SECRET`, `SUPABASE_KEY`, `OPENAI_API_KEY`).
- `.gitignore` excludes `.env` and `backend/data`; `.env.example` ships with blank values.
- The frontend contains no secrets; all privileged calls go through the backend.

## Takeaway
Correct separation of secrets from source and client.
