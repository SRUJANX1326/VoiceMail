# Naming and readability

**Scoring area:** Code Quality (84/100)

## What graders look for
Names that reveal intent; consistent casing; no cryptic one-letter variables outside tiny scopes.

## Where your project stands
Backend names are clear (`uploadToDrive`, `resolveFile`, `friendlyDriveError`, `findContact`). In `frontend/src/App.jsx` and `dialog.js`, short names like `d`, `t`, `r`, `f`, `m`, `a` are common, and `say`/`converse`/`loop` are good but undocumented.

## Gap
Very long single-line statements (several JSX lines exceed 300 characters) hurt readability more than naming does.

## What to do
1. Rename `d` to `dialog`, `t` to `transcript`, `r` to `result` in `App.jsx` `converse()` and `loop()`.
2. Break the long JSX one-liners (workflow steps, voice-status ternary) into small named components.
3. Keep export names consistent: backend uses `store.load/save`; consider `loadTokens/saveTokens` for clarity.
