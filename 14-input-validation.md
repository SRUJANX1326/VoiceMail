# Input validation

**Scoring area:** Security (96/100)

## What graders look for
All external input is validated for type, length, and format.

## Where your project stands
Good: recipient regex on `/api/send`, `resolveFile` rejects path separators, dotfiles, unknown extensions, and files over 25 MB; `saveContact` validates email; JSON body capped at 100 KB.

## Gap
`subject` and `body` have no length limit beyond the 100 KB JSON cap; `name` and `history` for `/api/chat` and `/api/suggestion` are not type-checked. Header injection is already blocked: the recipient regex excludes whitespace (so no CR/LF) and the subject is base64-encoded.

## What to do
1. Keep the whitespace-free recipient regex; add a test proving a `to` containing CRLF is rejected with 400.
2. Cap `subject` (200 chars) and `body` (20,000 chars).
3. Add `zod` or hand-written validators for each route's body.
