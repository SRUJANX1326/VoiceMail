# Tests for tricky voice behaviour

**Scoring area:** Testing (79)

## Why this earns a high score
Shows attention to real-world edge cases.

## Evidence in your project
- `late onend of an old recognizer does not cancel the next listen` guards a race condition.
- `native result: JSON array and old plain-text both work` guards backwards compatibility with the Android bridge.

## Takeaway
Subtle, hard-to-reproduce bugs have regression tests.
