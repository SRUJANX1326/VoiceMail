# Motion and sensory considerations

**Scoring area:** Accessibility (93/100)

## What graders look for
Respect reduced-motion preferences; do not rely on colour alone.

## Where your project stands
This is a strength: a `prefers-reduced-motion: reduce` block disables animations and transitions. Phase is also given as text (`LABEL[phase]`), so colour is not the only signal.

## Gap
The `sent` and `uploaded` states change the orb colour to green; the text label covers it, but the log entries for `error` and `sent` differ by colour only.

## What to do
1. Prefix log lines with text or an icon ("Error:", "Sent:").
2. Mention the reduced-motion support in the README accessibility section.
3. Add a toggle to disable the pulsing orb for sensitive users.
