# Edge cases worth adding

**Scoring area:** Testing (79/100)

## What graders look for
Boundary, error, and adversarial inputs.

## Where your project stands
Good coverage of spoken emails (underscore, dash, "at the rate of") and YES/NO phrases.

## Gap
Missing: ambiguous replies ("yes but no"), empty speech results, very long utterances, non-English input (the YES regex includes "haan"/"nahi"), two contacts with the same name, file names with spaces, uppercase extensions (`REPORT.TXT`), and a file removed between listing and upload.

## What to do
1. Add table-driven tests (`for (const [input, expected] of cases)`) to `normalize.test.mjs` and `dialog.test.mjs`.
2. Test `resolveFile('REPORT.TXT')` and `resolveFile('a b.txt')`.
3. Test the 25 MB boundary: exactly 25 MB passes, one byte over fails.
