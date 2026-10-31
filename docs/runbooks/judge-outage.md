# Runbook: Judge Fleet Outage During Contest (SEV2)

## Symptoms
- Alert `JudgeNodeMissingHeartbeat` or `HighQueueWaitTime` fires.
- Submissions queue depth increases without draining.
- "Judging is busy" banner displays on web UI.

## Diagnosis
1. Check WireGuard tunnel connectivity:
   ```bash
   ping -c 3 10.100.0.2
   ```
2. Inspect Judge Agent daemon logs on Judge Host:
   ```bash
   journalctl -u dagna-judge-agent.service -n 100 --no-pager
   ```

## Recovery
1. Submissions are persisted safely in MongoDB; zero data loss occurs.
2. If Judge Agent crashed, restart service:
   ```bash
   systemctl restart dagna-judge-agent.service
   ```
3. Expired leases automatically return to `queued` state and resume judging.
