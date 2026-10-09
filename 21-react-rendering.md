# React rendering behaviour

**Scoring area:** Efficiency (80/100)

## What graders look for
No wasteful re-renders; state placed where needed.

## Where your project stands
`App` holds many `useState` values (log, liveLine, draft, upload, conn, phase, step...). Every `add()` re-renders the whole page, including the large static sidebar and workflow sections.

## Gap
`add()` also keeps up to 30 log entries in state even though the log is no longer displayed (the UI shows only the latest line).

## What to do
1. Extract `Sidebar`, `Workflow`, `Preferences`, `DraftCard` into components wrapped in `React.memo`.
2. Remove the unused `log` state or render it, so it is not carrying dead work.
3. Wrap handlers passed to children in `useCallback`.
