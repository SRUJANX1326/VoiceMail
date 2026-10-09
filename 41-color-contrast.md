# Colour contrast

**Scoring area:** Accessibility (93/100)

## What graders look for
WCAG AA: 4.5:1 for normal text, 3:1 for large text and UI components.

## Where your project stands
I computed ratios from `styles.css`: muted text `#858b92` on `#0d0e0f` is 5.62:1 (pass); orange `#ff4b35` on the page background is 6.03:1 (pass). Failures: nav label `#60656c` on `#080909` is 3.39:1; footer `#70767e` on `#070808` is 4.37:1; white button text on `#f43d2b` is 3.78:1.

## Gap
Three combinations fall below 4.5:1 for small text.

## What to do
1. Raise `.nav-label` to about `#8a8f96` and `.footer` text to `#8d939a`.
2. Darken the primary button gradient end (for example `#d93321`) or use bold 14px+ text so it counts as large text.
3. Check with the Chrome DevTools contrast picker and Lighthouse.
