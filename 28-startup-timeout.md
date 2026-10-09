# Health check with timeout

**Scoring area:** Efficiency (80)

## Why this earns a high score
Prevents hanging on a bad dependency.

## Evidence in your project
- `health()` races each Supabase query against an 8-second timeout.
- It returns a specific hint (missing tables, wrong key, unreachable URL) instead of hanging.
- `/api/health` exposes it for quick checks.

## Takeaway
Fast failure and fast diagnosis.
