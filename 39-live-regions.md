# Live regions and status announcements

**Scoring area:** Accessibility (93/100)

## What graders look for
Dynamic updates are announced to assistive tech.

## Where your project stands
The live conversation line has `aria-live="polite"`, and the orb container has an `aria-label` that tracks the phase.

## Gap
`aria-label` on a plain `div` is not reliably announced. Email sent, upload success, and errors are only shown visually in some cards. The line clears after 4.5 seconds, which is too fast for slow readers.

## What to do
1. Add a visually hidden `<div role="status" aria-live="polite">` that mirrors `LABEL[phase]`.
2. Use `role="alert"` for errors (microphone blocked, send failure).
3. Let the user keep the last line on screen (a Preferences toggle), or lengthen the timeout.
