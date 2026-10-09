# Server startup and runtime cost

**Scoring area:** Efficiency (80/100)

## What graders look for
Fast start, lazy init, low idle usage.

## Where your project stands
`store.js` imports Supabase lazily only when configured (`await import`), which is a nice touch. `health()` runs three table checks sequentially at startup.

## Gap
The three health checks run one after another (each can take up to 8 s on a slow link), delaying the readiness log.

## What to do
1. Run the three `select` checks with `Promise.all`.
2. Do the startup health check without blocking `listen`.
3. Serve `index.html` with short cache and assets with long cache.
