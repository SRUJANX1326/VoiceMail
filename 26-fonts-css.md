# Fonts and CSS delivery

**Scoring area:** Efficiency (80/100)

## What graders look for
Non-blocking font loading, minimal CSS, no render-blocking imports.

## Where your project stands
`styles.css` starts with an `@import url('https://fonts.googleapis.com/...')`, which blocks rendering until Google Fonts responds. CSS is minified in `dist` but the source holds several overriding blocks.

## Gap
`@import` inside CSS is a known performance anti-pattern, and it fails in offline or restricted networks.

## What to do
1. Move fonts to `<link rel="preconnect">` + `<link rel="stylesheet">` in `index.html` with `display=swap`.
2. Self-host two weights with `@fontsource` to remove a third-party request.
3. Prune the duplicate CSS blocks.
