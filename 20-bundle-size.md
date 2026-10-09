# Frontend bundle size

**Scoring area:** Efficiency (80/100)

## What graders look for
Small production bundle, tree-shaking, code splitting.

## Where your project stands
`frontend/dist/assets/index-*.js` is about 175 KB (React + app) and the CSS about 15 KB. That is reasonable for React 18, but everything ships in one chunk.

## Gap
No lazy loading; speech-voice and drive features load even if never used. No gzip/brotli reporting.

## What to do
1. Run `npx vite-bundle-visualizer` and note the result in the README.
2. Lazy-load rarely used UI with `React.lazy`.
3. Enable `compression` middleware (or pre-compressed assets) in Express.
