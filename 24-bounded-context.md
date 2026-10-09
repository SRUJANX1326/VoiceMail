# Bounded prompt and history size

**Scoring area:** Efficiency (80)

## Why this earns a high score
Smaller prompts mean lower latency and cost.

## Evidence in your project
- `chat()` sends only the last 12 turns (`history.slice(-12)`).
- Chat replies are limited to two short spoken sentences by the system prompt.
- Email drafts target about 200 words, so output stays short.

## Takeaway
Keeps responses quick enough for voice.
