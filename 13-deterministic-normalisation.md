# Deterministic handling of spoken addresses

**Scoring area:** Security (96)

## Why this earns a high score
Sensitive data (email addresses) is processed by predictable code before AI sees it.

## Evidence in your project
- `emailNormalize.js` converts "john dot doe at gmail dot com" to `john.doe@gmail.com`, also underscore, dash, "at the rate of" and spoken digits.
- A test confirms the address inside a sentence is replaced before the text goes to the LLM.
- The model never has to guess or invent a recipient address.

## Takeaway
Reduces both errors and the risk of the AI altering an address.
