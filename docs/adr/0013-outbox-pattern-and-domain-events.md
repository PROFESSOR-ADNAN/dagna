# ADR 0013: Outbox Pattern and Exactly-Once Domain Event Processing

## Status
Accepted

## Context
When a judge job finishes and commits a judgment, downstream side-effects must occur:
- Contest scoreboards must be recalculated.
- SSE streams must notify clients.
- If a contest has ended and all jobs finish, finalization and rating updates must run.
- Audit logs and notifications must be generated.
If MongoDB commits the judgment but the BullMQ queue fails or worker restarts, messages could be lost (dual-write problem).

## Decision
1. **Transactional Outbox:** Every domain state change commits an event to the `outbox` collection within the **same atomic MongoDB transaction** as the business entity change.
   - Example: updating `submissions` to `judged` writes `{ eventId: UUID, type: 'judgment.final', payload: { submissionId, judgmentId }, status: 'pending' }` in the same transaction.
2. **Outbox Relay:** A dedicated worker process queries pending outbox events (or uses MongoDB Change Streams where available), dispatches them to BullMQ queues with the `eventId` as the BullMQ `jobId` (for idempotency), and marks the outbox event `relayed: true`.
3. **Idempotent Consumers:** Downstream workers check `processedEvents` or use upsert semantics to ensure idempotency.
