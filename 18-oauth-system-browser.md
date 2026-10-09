# OAuth in the system browser

**Scoring area:** Security (96)

## Why this earns a high score
Following Google's policy and safe sign-in practice.

## Evidence in your project
- Google blocks sign-in inside WebViews, so `MainActivity` opens the consent page in the phone's real browser through `Android.openUrl`.
- Refresh tokens are requested with `access_type=offline` and `prompt=consent` and stored server-side, so they never reach the browser or app.
- Redirect URI is configured explicitly via `GOOGLE_REDIRECT_URI`.

## Takeaway
Sign-in follows the secure, supported pattern.
