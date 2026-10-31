# ADR 0017: Rejudge Semantics and Post-Finalization Invariants

## Status
Accepted

## Context
If a problem setter discovers an error in a test case or checker during or after a contest, submissions must be rejudged without losing audit history or corrupting finalized ratings.

## Decision
1. **Immutable Judgments History:**
   Rejudging a submission creates a **new judgment record** (`attempt + 1`). The previous judgment record is preserved with `isCurrent = false`.
2. **Rejudge Scopes:**
   - Single Submission: rejudges specified submission ID.
   - Problem Version: creates rejudge jobs for all submissions on that problem version.
   - Contest: creates rejudge jobs for all submissions across all problems in that contest.
3. **Queue Prioritization:**
   - Active running contest rejudges run at `priority = 0` (urgent).
   - Post-contest rejudges run at `priority = 2` (background).
4. **Finalized Contests Warning:**
   If an admin requests a rejudge on a `finalized` contest whose ratings have already been published:
   - The UI displays an explicit high-risk modal warning.
   - Rejudging updates standings and creates an audit log entry.
   - Ratings are NOT automatically updated until the admin triggers a deliberate `Rating Recompute` job.
