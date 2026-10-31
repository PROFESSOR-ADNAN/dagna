# Dagna (ዳኛ) Judge Gateway & Fleet Protocol

**Protocol Version:** `DAGNA-PROTOCOL-v1`

## 1. Sequence & Lease Fencing Flow

```mermaid
sequenceDiagram
    autonumber
    participant Judge as Judge Node (10.100.0.2)
    participant GW as Gateway (10.100.0.1:4001)
    participant DB as MongoDB (rs0)

    Judge->>GW: POST /judge/v1/jobs/claim (long-poll 25s, nodeId, token)
    GW->>DB: findOneAndUpdate({ state: 'queued' }, { state: 'leased', generation: ++gen, leaseExpiresAt: now+30s })
    DB-->>GW: Claimed Job (jobId, generation G, manifest, limits)
    GW-->>Judge: 200 OK (Job Payload, generation G)

    loop Every 10s Heartbeat
        Judge->>GW: POST /judge/v1/jobs/:jobId/heartbeat (generation G)
        GW->>DB: findOneAndUpdate({ _id: jobId, generation: G }, { leaseExpiresAt: now+30s })
        DB-->>GW: OK (Lease Extended)
        GW-->>Judge: 200 OK
    end

    Note over Judge: Compile & Execute Tests in Sandbox

    Judge->>GW: POST /judge/v1/jobs/:jobId/progress (generation G, testBatch)
    GW-->>Judge: 200 OK

    Judge->>GW: POST /judge/v1/jobs/:jobId/complete (generation G, finalVerdict, judgmentDetails)
    GW->>DB: Transaction: Save Judgment, Update Submission, Mark Job 'done', Insert Outbox 'judgment.final'
    DB-->>GW: Transaction Committed
    GW-->>Judge: 200 OK (Job Done)
```

## 2. Fencing Token Rejection (Zombie Node Handling)

If a judge node is paused or delayed by a network blip exceeding 30s:
1. Core Host scheduler sweep detects `state: 'leased' AND leaseExpiresAt < now`.
2. Scheduler increments `attempt = attempt + 1`, resets `state = 'queued'`, and clears `leaseOwner`.
3. Another judge node claims the job with generation `G + 1`.
4. If the zombie node awakens and attempts to complete with generation `G`:
   - Gateway verifies `current.generation === payload.generation`.
   - Generation mismatch occurs (`G != G + 1`).
   - Gateway immediately responds with `409 Conflict: Stale generation token`.
   - Zombie node immediately kills active sandbox and drops cached state.
   - Result: Exactly-once verdict guarantee; zero corrupted or duplicate scoreboards.
