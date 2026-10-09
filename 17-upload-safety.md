# File upload path safety

**Scoring area:** Security (96/100)

## What graders look for
No path traversal; allow-listed types; size limits.

## Where your project stands
This is a strength. `resolveFile` requires `name === path.basename(name)`, blocks dotfiles (so `.env` is never listed or uploaded), allow-lists extensions through a `TYPES` map, and enforces 25 MB. Tests cover these cases in `backend/test/drive.test.mjs`.

## Gap
The default `UPLOAD_DIR` is the project root, which also contains `README.md` and could expose project files; extension check relies on the name, not file content.

## What to do
1. Default `UPLOAD_DIR` to a dedicated `uploads/` folder.
2. Optionally sniff magic bytes for `pdf` and `png`.
3. Mention in the README that the folder is allow-listed on purpose.
