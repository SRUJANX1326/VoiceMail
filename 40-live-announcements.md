# Live region for spoken text

**Scoring area:** Accessibility (93)

## Why this earns a high score
Dynamic changes are exposed to screen readers.

## Evidence in your project
- The live conversation line uses `aria-live="polite"`, so new words are announced without interrupting.
- The section has `aria-label="Live conversation"` and the voice visual has an `aria-label` reflecting the current phase.

## Takeaway
Users of assistive technology are informed as the conversation changes.
