# ADR 0016: Contest Lifecycle State Machine and Late-Submission Rules

## Status
Accepted

## Context
Contests transition through distinct operational states: `draft`, `scheduled`, `running`, `ended`, `finalized`. Submissions arriving at the boundary must be classified accurately, and server time must be the single source of truth.

## Decision
1. **Server Time is the Only Time:**
   - Submissions receive a monotonic UTC timestamp `receivedAt` immediately upon arrival at the Core API reverse proxy.
   - Contest submission time is calculated as `contestTimeSeconds = floor((receivedAt - startAt) / 1000)`.
   - Client clocks are ignored for judging and scoring.
2. **State Transitions:**
   - `draft -> scheduled`: Contest configured, problems locked.
   - `scheduled -> running`: Triggered by scheduler at `startAt`. Problem statements unlock; Redis statement cache warms up.
   - `running -> ended`: Triggered at `endAt`. Submissions arriving after `endAt` are accepted as **practice submissions** (`late: true`) and never modify contest standings.
   - `ended -> finalized`: Triggered when all submissions within the contest window have completed judging and no judge jobs remain in-flight. Finalizes standings and emits `contest.finalized` for rating calculation.
3. **Duplicate Submission Rule:**
   Submissions containing identical SHA-256 source code hashes from the same user for the same problem within a 120-second window are rejected with `400 Bad Request` to conserve judge fleet capacity.
