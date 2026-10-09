# Two-step confirmation before sending

**Scoring area:** Security (96)

## Why this earns a high score
Preventing unintended irreversible actions is a major safety property.

## Evidence in your project
- The assistant asks "I heard apc@gmail.com. Is that correct?" and then "Shall I send it?"; it never sends without both a yes.
- The rule is enforced in code in `frontend/src/dialog.js`, not left to the AI model.
- Tests: `recipient confirmation supports correction and never sends early`, `review and final send ... requires explicit confirmation`, `declining final send does not send`.

## Takeaway
Email can't go out because of a model mistake or a misheard word.
