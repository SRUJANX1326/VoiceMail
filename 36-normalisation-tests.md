# Speech-normalisation tests

**Scoring area:** Testing (79)

## Why this earns a high score
Data-conversion code is tested with real examples.

## Evidence in your project
- `normalize.test.mjs`: an address inside a sentence is replaced before the text reaches the LLM; no address returns `null`; `spellEmail` reads an address back correctly.
- Related dialog tests cover correction ("No, I meant abc123 at gmail dot com").

## Takeaway
The riskiest input conversion is verified.
