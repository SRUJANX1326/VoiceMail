# Error handling consistency

**Scoring area:** Code Quality (84/100)

## What graders look for
Predictable error shapes, no swallowed errors, user-friendly messages.

## Where your project stands
Strong: `wrap()` catches async route errors, `friendlyDriveError` maps Google errors to speakable messages, `gen()` retries and falls back models. Weak: several silent catches (`api.status().then(setConn).catch(() => {})`), routes return different shapes (`{error}` always, but `/api/drive/check` returns 200 with diagnostics), and 500 responses return raw `e.message`.

## Gap
Raw exception messages can leak internals; silent catches hide real failures from the user and from logs.

## What to do
1. Log (`console.warn`) inside the empty `.catch(() => {})` blocks, or surface a small toast.
2. Return generic text for 500s and log the detail server-side.
3. Define one `AppError(status, message)` class and use it in `resolveFile`, `store`, and routes.
