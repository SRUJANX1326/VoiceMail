# Bounded memory and file growth

**Scoring area:** Efficiency (80)

## Why this earns a high score
Nothing grows without limit.

## Evidence in your project
- The UI log keeps at most 30 entries (`l.slice(-30)`).
- Local email history is capped at 500 items per device.
- File listing excludes anything larger than 25 MB; findContact returns at most 5 matches.

## Takeaway
Predictable memory and disk usage.
