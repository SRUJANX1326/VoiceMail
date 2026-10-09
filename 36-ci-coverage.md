# CI and coverage reporting

**Scoring area:** Testing (79/100)

## What graders look for
Tests run automatically; a coverage threshold or report is visible.

## Where your project stands
No `.github/workflows` folder and no coverage output exist in the submission.

## Gap
Graders cannot see tests run unless they run them locally.

## What to do
1. Add `.github/workflows/ci.yml`: checkout, setup-node 20, `npm ci` and `npm test` in both packages, plus lint.
2. Fail CI under a coverage floor (for example 70 percent lines) using `--test-coverage-lines=70`.
3. Put the CI badge at the top of the README.
