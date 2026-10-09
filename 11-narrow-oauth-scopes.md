# Least-privilege OAuth scopes

**Scoring area:** Security (96)

## Why this earns a high score
Requesting only the permissions you need is a top security practice.

## Evidence in your project
- Only three scopes: `gmail.send`, `drive.file`, `userinfo.email` (`SCOPES` in `gmail.js`).
- `gmail.send` cannot read the inbox; `drive.file` only reaches files the app created, which the README states.
- The callback checks the granted scopes and warns the user if a box was not ticked.

## Takeaway
The app cannot read mail or browse the user's Drive, even if compromised.
