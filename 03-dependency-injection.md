# Dependency injection for testability

**Scoring area:** Code Quality (84)

## Why this earns a high score
Passing collaborators in, instead of hard-coding them, is a recognised quality practice.

## Evidence in your project
- `new Dialog(api)` receives the API layer, so tests use a fake.
- `uploadToDrive(drive, file)` takes a Drive client as a parameter (the comment says it is injectable so it can be tested without Google).
- `listFiles(dir)` and `resolveFile(name, dir)` accept a directory argument.

## Takeaway
The design choices that make the 60 tests possible.
