# ADR 0003: MongoDB Single-Node Replica Set for ACID Transactions and Outbox

## Status
Accepted

## Context
Dagna requires multi-document ACID transactions for critical domain operations:
1. Atomically recording a submission and its corresponding judge job queue entry.
2. Atomically committing a final judgment, updating submission status, and appending a `judgment.final` outbox event.
3. Finalizing contest standings and persisting batch rating changes.

MongoDB standalone instances do not support multi-document transactions.

## Decision
We configure MongoDB (version 7.0 LTS) as a single-node replica set (`rs0`) initialized via `rs.initiate()`. This enables the WiredTiger storage engine to support multi-document transactions, change streams, and atomic write operations without requiring a multi-node quorum or additional hardware expense.

## Alternatives Considered
- *Standalone MongoDB without transactions:* Vulnerable to orphaned submissions, desynchronized judge jobs, and outbox race conditions during power loss or worker crashes.
- *PostgreSQL / Relational DB:* While offering native transactions, Mongoose and MongoDB allow schema-flexible storage for multi-language statements, nested sample tests, and heterogeneous checker metadata.
- *3-Node MongoDB Replica Set:* Triples infrastructure footprint and cost, exceeding the $40/month budget.

## Consequences
Automated initialization scripts must ensure `rs0` is initiated before API or worker processes attempt transactional writes. Backups must capture the oplog (`mongodump --oplog`) to preserve point-in-time consistency.
