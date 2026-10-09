# OAuth flow hardening

**Scoring area:** Security (96/100)

## What graders look for
State/CSRF protection, least-privilege scopes, token handling.

## Where your project stands
Scopes are narrow and well chosen: `gmail.send`, `drive.file`, `userinfo.email`. `access_type=offline` with `prompt=consent` ensures a refresh token. The callback warns if a permission box was unticked.

## Gap
`state` is the raw device id, with no one-time nonce, so the callback cannot prove the same browser began the flow. The success page injects `${email}` into HTML without escaping.

## What to do
1. Generate a random nonce per login, store it server-side (or in a signed cookie) with the device id, verify on callback, then delete it.
2. Escape the email (`&`, `<`, `>`, `"`) before putting it in the HTML response.
3. Add PKCE if you move to a public client.
