# Tests for the safety guarantees

**Scoring area:** Testing (79)

## Why this earns a high score
Testing negative paths shows engineering maturity.

## Evidence in your project
- `recipient confirmation supports correction and never sends early`.
- `declining final send does not send`.
- `send: rejects invalid recipient` and `send: rejects when Google is not connected (nothing sent)`.
- `upload refused when Google is not connected`.

## Takeaway
The most important rules (never send or upload without consent) are verified.
