# Path-traversal-safe file upload

**Scoring area:** Security (96)

## Why this earns a high score
File access driven by user input is a classic attack surface; this one is closed.

## Evidence in your project
- `resolveFile` requires `name === path.basename(name)`, so `../x` and `a/b` are rejected.
- Names starting with `.` are rejected, so `.env` is never listed or uploaded.
- Only extensions in the `TYPES` allow-list pass; files over 25 MB are refused; files are read only from one configured folder.
- Tests: `only safe file types are listed (no dotfiles, no .js)` and `resolveFile blocks traversal, dotfiles, bad types and missing files`.

## Takeaway
Allow-list design with test proof.
