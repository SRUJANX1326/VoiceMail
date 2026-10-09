# Comments and inline documentation

**Scoring area:** Code Quality (84/100)

## What graders look for
Comments explain why, not what; public functions have short doc comments.

## Where your project stands
Good: header comments in `drive.js`, `store.js`, `dialog.js` and a JSDoc-style note on `resolveFile` and `health`. Weak: `gemini.js` prompts, `voice.js` and `App.jsx` have almost no explanation of the speech/interrupt logic.

## Gap
The trickiest parts (barge-in, wake-word matching, the confirmation gating) have the least commentary.

## What to do
1. Add 2-3 line comments above `WAKE`, `BYE`, `YES`, `NO` regexes saying what they must and must not match.
2. Add JSDoc (`@param`, `@returns`) to exported functions in `gmail.js`, `gemini.js`, `store.js`.
3. Document the Dialog state diagram once at the top of `dialog.js`.
