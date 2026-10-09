# LLM latency and retries

**Scoring area:** Efficiency (80/100)

## What graders look for
Bounded retries, timeouts, backoff, fallbacks.

## Where your project stands
`gen()` has model fallback and exponential backoff on 500/503, and quota messages on 429. Chat history is trimmed to the last 12 turns.

## Gap
There is no `AbortController` timeout on `fetch`, so a hung request blocks the voice loop. Retries for 503 are sequential, adding up to several seconds of silence in a voice UI.

## What to do
1. Wrap each `fetch` with `AbortSignal.timeout(15000)`.
2. Speak a short filler ("One moment") if a request exceeds ~2 seconds.
3. Lower `maxOutputTokens` for chat (2 sentences) to cut latency.
