# Runbook: Suspected Sandbox Escape or Judge Host Compromise (SEV1)

## Symptoms
- Alert `SandboxHygieneFailure` triggered.
- Unaccounted processes running on Judge Host.
- Kernel panic or unexpected outbound connection attempt from Judge Host.

## Immediate Mitigation Steps
1. **Pause Judging Platform-Wide:**
   ```bash
   bash scripts/pause-judging.sh
   ```
2. **Quarantine Compromised Node:**
   ```bash
   bash scripts/quarantine-node.sh <nodeId>
   ```
   This immediately revokes the node's token and rejects any in-flight lease completions.
3. **Isolate Judge Host at Firewall:**
   Disable the WireGuard peer interface on Core Host:
   ```bash
   wg set wg0 peer <JudgePublicKey> remove
   ```
4. **Preserve Forensic Evidence:**
   Capture memory dump and system logs before tearing down the VM.
5. **Rebuild Judge Host from Code:**
   Reprovision a fresh Judge VPS via OpenTofu and Ansible in < 15 minutes.
6. **Rejudge Affected Submissions:**
   Trigger contest rejudge on submissions evaluated by that node.
