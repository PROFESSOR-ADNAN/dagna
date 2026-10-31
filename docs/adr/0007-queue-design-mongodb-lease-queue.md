# ADR 0007: MongoDB Lease Queue with Aging and Priority over Redis Queues

## Status
Accepted

## Context
When thousands of submissions arrive during the final minutes of a contest, judging jobs must be persisted with guaranteed durability. If Redis crashes or its memory is flushed, unjudged submissions and in-flight contest state must not be lost. We must determine the source of truth for the judging queue.

## Decision
1. **MongoDB is the Queue Source of Truth:** `judgeJobs` is stored directly in MongoDB with atomic transactional leasing via `findOneAndUpdate`.
2. **Compound Index for Claiming:** An indexed query on `{ state: 1, priority: 1, readyAt: 1 }` enables sub-millisecond atomic claims without collection scans.
3. **Priority Levels:**
   - `0`: Contest Submissions (highest priority)
   - `1`: Practice Submissions
   - `2`: Rejudges
   - `3`: Problem Package Validations
4. **Aging Mechanism:** To prevent starvation of validations and background rejudges during peak contest traffic, an automated aging rule bumps waiting jobs up one priority level after 60 seconds of waiting.
5. **Role of Redis:** Redis is purely an ephemeral accelerator: a Redis pub/sub signal wakes up long-polling gateway threads when new jobs are enqueued. If Redis goes down, the gateway gracefully falls back to polling MongoDB every 2 seconds.

## Consequences
- Guaranteed zero job loss if Redis restarts or is completely wiped.
- Guaranteed transactional alignment between `submissions` and `judgeJobs`.
