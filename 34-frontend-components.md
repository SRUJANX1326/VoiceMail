# Frontend component tests

**Scoring area:** Testing (79/100)

## What graders look for
UI components are rendered and asserted.

## Where your project stands
Frontend tests cover logic modules only; there is no React rendering test. `package.json` has no `vitest`, `@testing-library/react`, or `jsdom`.

## Gap
Rendering regressions and accessibility attributes are untested.

## What to do
1. Add `vitest`, `@testing-library/react`, `jsdom`.
2. Test: "Start listening" button toggles to "Stop listening"; connection indicator shows the email when `status()` returns connected.
3. Add `jest-axe` or `vitest-axe` to assert no a11y violations (supports the Accessibility score).
