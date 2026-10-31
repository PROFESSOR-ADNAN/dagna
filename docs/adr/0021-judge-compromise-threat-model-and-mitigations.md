# ADR 0021: Judge Node Compromise Threat Model and Blast-Radius Containment

## Status
Accepted

## Context
If an adversary successfully exploits a 0-day in the Linux kernel or toolchain runtime from inside the sandbox, they might escape into the Judge Host operating system. We must evaluate the worst-case blast radius and design mitigations so a compromised judge node cannot compromise the Core Host or database.

## Threat Model & Blast Radius
1. **Network Containment:**
   - The Judge Host has NO network route to MongoDB (port 27017) or Redis (port 6379).
   - Firewall rules on the Core Host reject all packets from the WireGuard subnet to any port other than the private Judge Gateway listener port (4001).
   - Cloud metadata IP (`169.254.169.254`) is completely blocked.
2. **Credential Minimization:**
   - The Judge Host holds zero database passwords, zero JWT signing keys, and zero S3 admin credentials.
   - It only possesses its own WireGuard private key and a single hashed `nodeToken`.
3. **Gateway Enforcement:**
   - The private Gateway `/judge/v1` permits the node to fetch test data ONLY for jobs currently leased by that specific node ID.
   - A compromised node cannot query user accounts, list arbitrary problems, or download test suites for unleased problems.
4. **Forged Verdict Mitigation & Node Revocation:**
   - If a node reports abnormal verdict distributions (e.g. 1000 ACs in 10 seconds), rate-anomaly alerts fire.
   - An administrator can instantly revoke or quarantine any node via `scripts/quarantine-node.sh <nodeId>`, immediately rejecting all active leases and disconnecting the node.
   - Optional `DOUBLE_JUDGE_CONTEST_AC` feature flag enables redundant judging of first-solve ACs across two distinct judge nodes.
