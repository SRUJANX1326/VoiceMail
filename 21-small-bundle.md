# Lean frontend bundle

**Scoring area:** Efficiency (80)

## Why this earns a high score
Fast load on phones and slow networks.

## Evidence in your project
- Production JS is about 175 KB (React 18 plus the whole app) and CSS about 15 KB.
- Only two runtime dependencies in the frontend: `react` and `react-dom`.
- Vite produces hashed, minified assets in `frontend/dist`.

## Takeaway
No heavy UI framework or large libraries.
