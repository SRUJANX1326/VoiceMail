# LLM client tests with a mocked `fetch`

**Scoring area:** Testing (79/100)

## What graders look for
External services are mocked; retry and fallback logic is tested.

## Where your project stands
`gemini.js` contains the most branching logic in the backend (retry on 503, fall back on 404, stop on 429, provider switching) and I found no tests for it.

## Gap
A regression there would break every voice conversation without any failing test.

## What to do
1. Stub `globalThis.fetch` to return sequences: 503, 503, 200 (expects success); 404 then 200 on fallback model; 429 (expects friendly message).
2. Test that JSON wrapped in ```json fences is parsed.
3. Test `chat()` returns `intent: 'chat'` for malformed model output.
