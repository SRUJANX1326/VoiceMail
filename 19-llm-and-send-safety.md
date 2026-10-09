# LLM misuse and the send-confirmation guarantee

**Scoring area:** Security (96/100)

## What graders look for
Prompt-injection resistance; destructive actions need explicit user confirmation.

## Where your project stands
This is a real strength: sending requires a spoken yes to the address and a final yes, enforced in `dialog.js` code and not left to the model. Addresses are normalised deterministically before any AI sees them. The model returns JSON only.

## Gap
User text and past email history are concatenated into prompts, so a past email containing instructions could influence a draft (it still cannot send by itself).

## What to do
1. Wrap history and user text in clear delimiters and tell the model to treat them as data.
2. Validate the model's JSON (types, max length) before using it.
3. Document the confirmation guarantee in the README under a Security section.
