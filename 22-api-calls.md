# API call patterns and caching

**Scoring area:** Efficiency (80/100)

## What graders look for
No redundant requests; caching where data is stable.

## Where your project stands
`refresh()` calls `/api/status` on mount and whenever the tab becomes visible, which is sensible. `/api/drive/files` is requested at each upload attempt. Contact lookup runs on every email flow.

## Gap
No caching headers on static assets or API reads; `status` refresh after every error (`catch` in `converse`) may fire repeatedly.

## What to do
1. Add `Cache-Control: public, max-age=31536000, immutable` for hashed files in `dist/assets` via `express.static` options.
2. Cache `/api/drive/files` for a few seconds on the server.
3. Debounce `refresh()` after errors.
