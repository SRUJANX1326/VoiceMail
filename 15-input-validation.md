# Server-side input validation

**Scoring area:** Security (96)

## Why this earns a high score
Never trust client data.

## Evidence in your project
- `/api/send` validates the recipient with a regex that excludes whitespace and `@` abuse; the test `send: rejects invalid recipient` proves it.
- `saveContact` validates and lowercases emails.
- `express.json({ limit: '100kb' })` caps request size.
- Routes return 400 for missing `device`, `text`, `name`; 401 when Google is not connected.

## Takeaway
Bad input is rejected early with a correct status code.
