# Keyboard operation and focus visibility

**Scoring area:** Accessibility (93/100)

## What graders look for
Everything is reachable by keyboard with a clearly visible focus indicator.

## Where your project stands
Controls are real `<button>` and `<input>` elements, so tab order works. However, `styles.css` defines no `:focus` or `:focus-visible` styles, and global `button{...}` plus `transition` rules rely on the browser default outline against a dark background.

## Gap
The default outline can be invisible on dark surfaces; WCAG 2.4.7 requires a visible focus indicator.

## What to do
1. Add `:focus-visible{outline:2px solid #ff9a86;outline-offset:2px}` for `button, select, input`.
2. Add visible focus to the toggle `input` (custom accent-color alone is not enough).
3. Add keyboard shortcut (for example Space or `S`) to start/stop listening, documented in the README.
