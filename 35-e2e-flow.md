# End-to-end and conversation-flow tests

**Scoring area:** Testing (79/100)

## What graders look for
A realistic scenario run through the whole flow.

## Where your project stands
`dialog.test.mjs` (11 tests) simulates conversations with a fake API, which is the right idea.

## Gap
Not covered: full happy path "write mail -> contact -> confirm -> subject -> body -> review -> send" in one test; interruption mid-confirmation; LLM failure mid-flow.

## What to do
1. Add one scripted full-flow test asserting `api.send` is called exactly once, and never before both confirmations.
2. Add a negative test: user says "no" at the final step, assert `send` is never called.
3. Optional: Playwright smoke test that loads `/` and checks the title and Start button.
