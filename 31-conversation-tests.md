# Conversation-flow tests

**Scoring area:** Testing (79)

## Why this earns a high score
The most complex logic (the dialog state machine) is tested through realistic scenarios.

## Evidence in your project
- 11 tests in `dialog.test.mjs`, including: asks if the recipient is saved before drafting, new contact usable with or without saving, no drafting until subject and body are given, long description reused instead of re-asked, short fragment not treated as complete instructions, normal chat still works.
- A fake API is injected, so flows run without network.

## Takeaway
User-facing behaviour is locked in by tests.
