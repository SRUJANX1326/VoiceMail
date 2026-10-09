# Pure, side-effect-free helpers

**Scoring area:** Code Quality (84)

## Why this earns a high score
Pure functions are predictable and easy to verify.

## Evidence in your project
- `normalizeSpokenEmail` and `spellEmail` turn speech into addresses and back with no I/O.
- `spokenFileName('report dot t x t')` returns `report.txt`.
- `buildRaw` builds the MIME message deterministically; `friendlyDriveError` maps an error to a message.
- `resolveFile` validates and returns data or throws, with no hidden state.

## Takeaway
Core logic is deterministic and unit-testable.
