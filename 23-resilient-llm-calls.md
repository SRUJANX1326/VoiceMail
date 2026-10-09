# Retry, backoff and fallback for LLM calls

**Scoring area:** Efficiency (80)

## Why this earns a high score
Efficient use of a rate-limited free tier avoids wasted user time.

## Evidence in your project
- `gen()` retries 500/503 up to 3 times with growing delays (`1000 * (attempt + 1)` ms).
- If one model is missing or busy it tries `GEMINI_FALLBACK_MODELS`.
- 429 stops immediately with a clear message instead of hammering the API.

## Takeaway
Reliable conversations without wasted requests.
