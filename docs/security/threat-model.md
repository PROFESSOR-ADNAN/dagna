# Dagna (ዳኛ) STRIDE Security Threat Model & Containment Matrix

## 1. STRIDE Analysis

| STRIDE Category | Threat Vector | Target Component | Architectural Defense & Verification |
|---|---|---|---|
| **Spoofing** | Attacker impersonates judge node to forge verdicts | Judge Gateway (`/judge/v1`) | Per-node cryptographic token + WireGuard tunnel IP binding. Stored hashed. |
| **Tampering** | Contestant manipulates submission source or scoreboard | Submission / Standings | Source code immutable; standings derived exclusively from source submissions in MongoDB transactions. Float arithmetic banned. |
| **Repudiation** | Problem setter or admin alters problem data or contest status without trace | Admin Console / Problems | Immutable problem versioning (`packageHash`). Tamper-evident append-only `AuditLog` collection. |
| **Information Disclosure** | Untrusted code leaks hidden contest test data | Sandbox Runtime / Compilers | Read-only sandbox root; no network namespace (`CLONE_NEWNET`); test cases delivered on stdin; checker diagnostic messages hidden for contests. |
| **Denial of Service** | Fork bombs, memory hogging, or CPU infinite loops | Judge Host OS / cgroup | cgroup v2 controllers: `pids.max = 64`, `memory.max` hard ceiling with swap disabled, monotonic wall-clock timer safety net. |
| **Elevation of Privilege** | Sandbox escape to host root | Linux Kernel / Toolchains | Unprivileged user namespaces (`CLONE_NEWUSER`), capabilities dropped, `PR_SET_NO_NEW_PRIVS`, seccomp BPF filter. Agent runs as unprivileged UID 1001. |

## 2. Blast-Radius Containment on Judge Host Compromise
If an adversary achieves remote code execution outside the sandbox on the Judge Host:
1. **Network Boundary:** The Judge Host has NO network route to MongoDB (port 27017) or Redis (port 6379). Firewalls drop all cross-subnet attempts.
2. **Credential Boundary:** The Judge Host holds ZERO database passwords, S3 root credentials, or user secrets.
3. **Gateway Scoping:** The Gateway permits downloading blobs ONLY for currently leased jobs.
4. **Immediate Quarantine:** `scripts/quarantine-node.sh <nodeId>` instantly revokes all active leases and drops the node.
