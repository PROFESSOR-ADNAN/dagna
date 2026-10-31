# ADR 0012: Content-Addressed Test Blob Storage and Local Judge Cache

## Status
Accepted

## Context
Problems often have 50 to 100 test cases with sizes up to 20-50 MB per problem. Downloading test cases over the WireGuard tunnel for every single submission would saturate network bandwidth and increase judging latency to tens of seconds.

## Decision
1. **Content-Addressing:** All test inputs, jury answers, and checkers are stored in S3/MinIO keyed by their cryptographic SHA-256 hash: `s3://dagna-test-blobs/<sha256>`.
2. **Database Storage:** The database stores only hash digests and byte lengths, never raw test payloads.
3. **Local Judge Node LRU Cache:**
   - Judge nodes maintain a local disk cache (`judge/cache/blobs/<sha256>`).
   - Capped at 10 GB disk space.
   - When disk usage exceeds 85%, least-recently-used (LRU) blobs are evicted.
   - Blobs are integrity-checked against their SHA-256 digest before being delivered to sandboxes.
4. **Zero Test Data in Browser:** Hidden test inputs and answers are never served over public APIs or rendered in client HTML.
