# Email MIME building tests

**Scoring area:** Testing (79/100)

## What graders look for
Pure functions with tricky output should be unit tested.

## Where your project stands
`buildRaw` in `gmail.js` base64-encodes the subject and body, which matters for non-ASCII text, but I found no test asserting its output.

## Gap
Header-injection safety and unicode subject behaviour are true by design but unverified by tests.

## What to do
1. Decode `buildRaw` output and assert `Subject:` is RFC 2047 encoded for `"Réunion 会議"`.
2. Assert a subject containing `\r\nBcc:` stays inside the encoded `Subject:` header and creates no extra header.
3. Assert the body round-trips exactly.
