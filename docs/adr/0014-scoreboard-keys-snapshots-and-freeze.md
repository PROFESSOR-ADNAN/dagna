# ADR 0014: Scoreboard Snapshots, Freeze Semantics, and Exact Integer Rank Keys

## Status
Accepted

## Context
During high-stakes competitive programming contests, hundreds of participants reload the scoreboard simultaneously. Recomputing the full contest leaderboard from raw submissions on every HTTP GET would exhaust database CPU. Furthermore, contests require a scoreboard "freeze" during the final 60 minutes, where public spectators and competitors see frozen standings, while each participant can see their own real-time submission verdicts.

## Decision
1. **Incremental Cell Updates & Snapshot Generation:**
   - Standings are stored at cell granularity in MongoDB: `(contestId, userId, problemLabel)`.
   - On `judgment.final`, only the affected cell is recalculated from source submissions.
   - A debounced background worker (max 1 run per second per contest) computes participant totals, sorts standings, and writes a versioned JSON snapshot to Redis: `standings:snapshot:<contestId>:<version>`.
2. **Exact Integer Rank Keys:**
   - Float arithmetic for standings sort keys is strictly prohibited.
   - For **ICPC**: `rankKey = (BigInt(solvedCount) << 32n) - BigInt(penaltyMinutes)`. Ties break by earliest `lastAcceptedAtSeconds`.
   - For **OI**: `rankKey = (BigInt(totalPoints) << 32n) - BigInt(lastImprovementAtSeconds)`.
3. **Scoreboard Freeze:**
   - When contest time reaches `freezeAt`, the system takes and locks a `frozen` snapshot.
   - Public GET requests receive the frozen snapshot.
   - An authenticated participant's client requests the frozen snapshot plus a personal overlay containing their own submissions with "Pending" marks shown on the public board.
   - Organizers and admins view the live unfreeze toggle via a privileged role check.
   - At contest unfreeze (`unfreeze` action or contest finalized), the live snapshot is published.
