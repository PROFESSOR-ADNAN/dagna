# ADR 0019: Backup Methodology and Disaster Recovery RPO/RTO Targets

## Status
Accepted

## Context
Data loss of student submissions, problem packages, or contest standings is unacceptable. We must design automated backup processes and define Recovery Point Objectives (RPO) and Recovery Time Objectives (RTO).

## Decision
1. **MongoDB Backups:**
   - Daily automated `mongodump --oplog --gzip` scheduled via cron / systemd.
   - During active contest days, frequency increases to hourly dumps.
   - Encrypted with age/GPG and synced to off-site cloud storage.
   - RPO target: ≤ 24 hours standard, ≤ 1 hour on contest days.
   - RTO target: ≤ 2 hours.
2. **Object Storage (S3 Test Blobs & Packages):**
   - S3 bucket versioning enabled.
   - Nightly backup with `restic` to an independent secondary cloud bucket.
3. **Stateless Components:**
   - Judge hosts and Redis caches are completely disposable and rebuildable from source code and Ansible playbooks in < 15 minutes.
4. **Automated Monthly Restore Verification:**
   A monthly test job restores the latest backup to a scratch database container and executes integrity assertions (all submission references exist, all blob hashes resolve, all standings recompute identically).
