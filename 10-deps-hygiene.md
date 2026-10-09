# Dependency and repo hygiene

**Scoring area:** Code Quality (84/100)

## What graders look for
Minimal dependencies, lockfiles, ignored build output, no committed secrets or junk.

## Where your project stands
Lockfiles exist; dependencies are small (express, googleapis, supabase-js, dotenv; react, vite). However the zip includes `android/.gradle/` caches, `frontend/dist/`, and `backend/.env`, all of which `.gitignore` already lists.

## Gap
Build output and Gradle caches in the submission add noise; `.env` is a security problem (see the security files).

## What to do
1. Run `git clean -fdX` or build the submission zip from `git archive` so ignored files never ship.
2. Add `engines: { node: ">=18" }` to both `package.json` files.
3. Run `npm audit` and `npm outdated`, and note the result in the README.
4. Submit through a GitHub repo with meaningful commits (the zip has no `.git`, so reviewers cannot see history).
