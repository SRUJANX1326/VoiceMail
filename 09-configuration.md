# Clean, environment-driven configuration

**Scoring area:** Code Quality (84)

## Why this earns a high score
Behaviour is changed through configuration, not code edits.

## Evidence in your project
- `.env.example` lists every variable with comments on where to get the value.
- `LLM_PROVIDER` switches between Gemini, Ollama and any OpenAI-compatible API (such as Groq).
- `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS`, `UPLOAD_DIR`, `PORT` all have sensible defaults.

## Takeaway
Easy to deploy and adapt without touching source.
