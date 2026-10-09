# Text size, zoom and responsive layout

**Scoring area:** Accessibility (93/100)

## What graders look for
Readable text sizes; layout survives 200 percent zoom and small screens.

## Where your project stands
A responsive layout exists (`@media(max-width:950px)` and `680px`), the viewport meta tag is set, and `min-width:320px` is used.

## Gap
Many labels use 9px, 10px and 11px font sizes (for example `.live-tag` 9px, `.toggle-row small` 10px). These are hard to read and do not scale if the user changes their default font size because they are set in `px`.

## What to do
1. Use `rem` and a floor of 12px (0.75rem) for secondary text, 14px for body.
2. Test at 200 percent browser zoom.
3. Remove `font-size:0` on `.secure-label` at mobile width; hide visually but keep the text available (use a `.sr-only` class).
