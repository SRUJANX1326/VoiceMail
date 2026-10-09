# Final submission checklist for attempt 2

**Scoring area:** Problem Statement Alignment (9, likely out of 10)

## What graders look for
The submission is complete, clean and reproducible.

## Where your project stands
Current archive includes `.env`, `dist/`, and `android/.gradle` caches, and has no CI, no lint, and no coverage report.

## Gap
Each of these maps to a point loss in Security, Code Quality or Testing.

## What to do
1. Rotate keys, remove `.env`, ship `.env.example` only.
2. `npm run lint`, `npm test` (root), coverage table in README.
3. Quick Start, screenshots, and the requirement table at the top of README.
4. Re-run an a11y check (axe) and note it in the README.
5. Zip from a clean `git archive`.
