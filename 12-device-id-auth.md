# Device ID as the only identity

**Scoring area:** Security (96/100)

## What graders look for
Authentication and authorization on every data endpoint.

## Where your project stands
Identity is a random 128-bit `deviceId` stored in `localStorage` and passed as a query/body parameter. It is unguessable, which is why this works, but it behaves as a bearer secret sent in URLs (`/api/status?device=...`, `/auth/google?device=...`) where it can land in logs and browser history.

## Gap
`/api/chat`, `/api/draft`, `/api/drive/files` need no identity at all, so anyone who finds the URL can spend your Gemini quota.

## What to do
1. Send the device id in an `Authorization: Bearer` or custom header, never the URL.
2. Issue a server-signed session cookie (`httpOnly`, `sameSite=lax`) after OAuth and use that instead.
3. Require the session on `/api/chat`, `/api/draft`, `/api/drive/files`.
