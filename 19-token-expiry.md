# Graceful token expiry and reconnect

**Scoring area:** Security (96)

## Why this earns a high score
Security-sensitive failures are handled without leaking details.

## Evidence in your project
- `invalid_grant` is mapped to "Google connection expired. Please reconnect." with HTTP 401 in both `/api/send` and Drive upload.
- `/api/drive/check` diagnoses permission vs API-not-enabled problems without exposing tokens.
- Unknown devices get a clean `connected: false` or 401 (tests: `status: not connected`, `send: rejects when Google is not connected (nothing sent)`).

## Takeaway
Predictable, safe behaviour when credentials are missing or stale.
