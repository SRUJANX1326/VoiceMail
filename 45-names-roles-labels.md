# Names, roles and labels for controls

**Scoring area:** Accessibility (93/100)

## What graders look for
Every control has an accessible name; state is exposed.

## Where your project stands
Buttons have visible text, the select and toggle are wrapped in labels. The Start/Stop button changes its text.

## Gap
The sidebar nav buttons do not mark the current page (`aria-current`), the Preferences toggle has no `role="switch"`, and icon glyphs inside buttons are read aloud as symbols.

## What to do
1. Add `aria-current="page"` to the active nav item.
2. Set `role="switch"` with `aria-checked` on the interrupt toggle (or keep a plain checkbox with a clear label).
3. Hide decorative glyphs with `aria-hidden`. Run axe DevTools and fix any remaining findings.
