# Memory, timers and cleanup

**Scoring area:** Efficiency (80/100)

## What graders look for
Listeners and timers cleaned up; bounded in-memory data.

## Where your project stands
Bounded growth is handled: log keeps 30 entries, chat sends 12 turns, email history file keeps 500. The `visibilitychange` listener is removed in the `useEffect` cleanup.

## Gap
`liveTimer` is never cleared on unmount; the speech recognition and TTS handles in `voice.js` are module-level singletons with no teardown on `stop()` beyond abort/interrupt.

## What to do
1. Clear `liveTimer` in the effect cleanup.
2. Confirm `abortListen` removes all recognition event handlers.
3. Add a small test or manual note showing no leaks after Start/Stop ten times.
