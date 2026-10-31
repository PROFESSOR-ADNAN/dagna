# ADR 0006: Pull-Based Judge Protocol with Leases and Generation Fencing Tokens

## Status
Accepted

## Context
In distributed judging systems, network partitions, judge node crashes, and timing hiccups can cause duplicate executions or "split-brain" judging where a delayed node overwrites a newer judgment with stale data. We must decide between a push model (Core initiates connections to Judge nodes) versus a pull model (Judge nodes poll Core), and design fencing safeguards.

## Decision
1. **Pull Model:** The Core Host never initiates outbound connections to Judge nodes. The Judge Agent establishes an outbound HTTP/2 session over the private WireGuard tunnel to the private Core Gateway (`/judge/v1`).
2. **Long-Poll Claim:** Judge nodes issue long-polling `POST /judge/v1/jobs/claim` requests (25-second timeout).
3. **Lease Model:** A claimed job receives an atomic lease for 30 seconds (`leaseExpiresAt = now + 30s`).
4. **Generation Fencing Token:** Every claim or re-lease increments the job's monotonic `generation` integer (1, 2, 3...).
5. **Heartbeat Protocol:** The agent sends `POST /judge/v1/jobs/:jobId/heartbeat` every 10 seconds. If a network blip occurs and Core expired the lease, the heartbeat returns `409 Conflict`. Upon receiving `409`, the agent immediately aborts execution, tears down the sandbox, and drops the job.
6. **Completion Fencing:** `POST /judge/v1/jobs/:jobId/complete` requires the active `generation`. If the generation does not match the active DB state, the request is rejected with `409` and logged as a fenced stale submission attempt.

## Alternatives Considered
- *Push Model (Core pushes to Judge nodes):* Requires Judge nodes to expose listening ports, opening inbound attack vectors on the Judge host and requiring complex firewall traversal.
- *Simple lock without fencing token:* Vulnerable to delayed completions overwriting valid rejudges after garbage collection pauses or transient network partitions.

## Consequences
- Guaranteed exactly-once effect on submissions.
- Completely immune to duplicate judgments caused by recovered zombie nodes.
