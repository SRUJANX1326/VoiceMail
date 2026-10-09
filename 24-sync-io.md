# Synchronous file I/O in the server

**Scoring area:** Efficiency (80/100)

## What graders look for
No blocking calls on the request path.

## Where your project stands
`store.js` uses `fs.readFileSync`, `writeFileSync`, `existsSync` in the file-backed mode, and `drive.js` uses `readdirSync`/`statSync` in `listFiles`. These block the event loop.

## Gap
For a single-user demo it is harmless, but a performance reviewer will point to blocking I/O in an Express handler; also file-mode writes are not atomic (a crash mid-write can corrupt JSON).

## What to do
1. Use `fs.promises` everywhere.
2. Write to a temp file then `rename` for atomic saves.
3. Keep an in-memory copy of the JSON and flush on change.
