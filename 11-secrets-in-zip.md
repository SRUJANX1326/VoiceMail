# Secrets shipped in the project (highest priority)

**Scoring area:** Security (96/100)

## What graders look for
No API keys, client secrets or tokens in the repository or archive.

## Where your project stands
`backend/.env` is inside the zip you uploaded and every variable is filled in (Gemini key, Google client secret, Supabase key, OpenAI/Groq key). `.gitignore` excludes it, but the zip includes it anyway.

## Gap
If this archive (or a screenshot of it) was submitted, those credentials are exposed. Even at 96, this is the single most damaging thing a scanner can find.

## What to do
1. Rotate now: Gemini key, Google OAuth client secret, Supabase secret key, Groq/OpenAI key.
2. Rebuild the submission zip without `.env`; keep only `.env.example`.
3. Run `gitleaks detect` or `trufflehog` before each submission.
4. If a key ever reached a public repo, treat it as burned even after deleting the file.
