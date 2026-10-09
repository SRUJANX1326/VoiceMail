# Duplication and dead code

**Scoring area:** Code Quality (84/100)

## What graders look for
No unused variables, files, CSS or commented-out code; repeated logic extracted.

## Where your project stands
Found concrete dead code: `transcriptRef` in `App.jsx` is scrolled in a `useEffect` but never attached to any element, and `document.querySelector('.log')` targets an element that no longer renders (the transcript was replaced by the compact live line). `styles.css` still carries `.transcript-log`, `.log`, `.activity-card` rules from earlier versions. The same email regex appears in `index.js`, `store.js`, and `dialog.js` (`VALID`). `gen()` in `gemini.js` repeats the JSON-cleaning `replace(...)` three times.

## Gap
Graders that scan for unused code will flag these. The multiple pasted CSS blocks at the bottom of `styles.css` override earlier rules, which is a smell.

## What to do
1. Delete `transcriptRef`, its `useEffect`, the `.log` nav button target, and unused CSS (`.transcript-log`, `.log`).
2. Create `shared/validators.js` exporting `isEmail` and use it in backend and frontend.
3. Extract `parseModelJson(raw)` in `gemini.js` and use it in all three providers.
