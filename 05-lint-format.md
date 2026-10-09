# Linting and formatting

**Scoring area:** Code Quality (84/100)

## What graders look for
A linter and formatter config that runs cleanly, ideally enforced by a script.

## Where your project stands
No `.eslintrc`, `eslint.config.js`, `.prettierrc` or `.editorconfig` exists in either package, and neither `package.json` has a `lint` script.

## Gap
Dense one-line code suggests no formatter has been applied; a grader sees no tooling at all.

## What to do
1. Add ESLint (flat config, `eslint-plugin-react`, `eslint-plugin-react-hooks`) and Prettier to both packages.
2. Add `"lint": "eslint ."` and `"format": "prettier --write ."` scripts.
3. Run Prettier once across the repo, then commit the diff as a single formatting-only change.
4. Add `.editorconfig` (2 spaces, LF, final newline).
