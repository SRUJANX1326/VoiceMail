# Function and file size

**Scoring area:** Code Quality (84/100)

## What graders look for
Small single-purpose functions; files under a few hundred lines; low nesting.

## Where your project stands
`frontend/src/dialog.js` is 284 lines with one `Dialog` class handling email, contacts, drive upload and diagnostics. `App.jsx` `converse()` mixes listening, confirmation, error handling and UI updates. `backend/index.js` (137 lines) holds every route.

## Gap
One class owns many states (`idle`, `choose_file`, `confirm_upload`, `check_contact`, `confirm_send`, ...). This is a state machine written as long `if` chains.

## What to do
1. Split `dialog.js` into `dialog/email.js`, `dialog/contacts.js`, `dialog/drive.js`, with a thin `Dialog` that routes by state.
2. Replace chained `if (state === ...)` with a `handlers = { confirm_send: ..., confirm_upload: ... }` lookup table.
3. Move routes out of `index.js` into `routes/auth.js`, `routes/contacts.js`, `routes/drive.js`, `routes/email.js`.
