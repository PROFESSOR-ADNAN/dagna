# Dagna (ዳኛ) Engineering Progress Log

## Phase Tracking

| Phase | Description | Status | Evidence / Artifacts |
|---|---|---|---|
| **Phase 0** | Plan, Assumptions, Architecture, ADRs, Project Scaffold | **PASS** | Monorepo structure, 21 ADRs in `docs/adr/`, `package.json`, shared types |
| **Phase 1** | Local Dev Environment, Dockerfiles, Compose, Makefile, Pre-commit | **IN_PROGRESS** | `docker/compose.yaml`, Dockerfiles, `Makefile` targets |
| **Phase 2** | Identity, Roles, Groups, Auth Tokens, MFA, Rate Limits | **PENDING** | Express Auth routes, JWT/cookie rotation, user models |
| **Phase 3A** | Sandbox Engine (`dagna-sandbox`), Hostile Test Suite, Calibration | **PENDING** | Linux namespaces, cgroup v2, hostile test corpus |
| **Phase 3B** | Problems, Packages, Gateway, Leases, Fencing, Submissions, Outbox | **PENDING** | MongoDB priority queue, atomic claims, outbox relay |
| **Phase 3C** | Contests, Scoreboard (ICPC/OI), Freeze, Clarifications, Rejudge | **PENDING** | Integer rank keys, Redis snapshots, freeze logic |
| **Phase 3D** | Rating Engine (Codeforces Elo), Leaderboards, Admin Console, Deletion | **PENDING** | Logistic Elo bisection, zero-sum fixes, admin controls |
| **Phase 4** | Automated Quality Gates, Property Tests, Integration Tests | **PENDING** | Fast-check property tests, explain query analysis |
| **Phase 5** | CI Pipelines, Lint, Security Scanning, Container Builds | **PENDING** | `.github/workflows/*.yml` |
| **Phase 6** | Nginx Proxy, Hardening, WireGuard Network Topology, TLS | **PENDING** | Nginx configs, Ansible roles, security headers |
| **Phase 7** | Infrastructure as Code (OpenTofu / Terraform) | **PENDING** | IaC modules for Core and Judge nodes |
| **Phase 8** | Continuous Delivery, Rollback, Contest Deploy Gate | **PENDING** | Blue/green deploy scripts, contest deploy guard |
| **Phase 9** | Observability, Prometheus, Alertmanager, Dashboards, Probes | **PENDING** | Metric definitions, Alertmanager rules, canary probe |
| **Phase 10** | Backup & Disaster Recovery, Restore Proof, Chaos Testing | **PENDING** | Backup/restore scripts, restore proof doc, chaos scripts |
| **Phase 11** | Security Audit, ASVS Checklist, STRIDE Threat Model | **PENDING** | Threat model, ASVS compliance matrix |
| **Phase 12** | Documentation, Runbooks, Go-Live Checklist, GitHub Push & Vercel | **PENDING** | User guides, API docs, GitHub repo, Vercel instructions |

## Key Decisions
- Standardized on Linux namespaces + cgroup v2 direct controllers + seccomp allowlist.
- Pull-based WireGuard judge gateway with 30s leases and monotonic generation fencing tokens.
- Single-node MongoDB replica set for multi-document ACID transactions and reliable outbox pattern.
- Pure integer rank keys (`BigInt`) for exact ICPC and OI scoreboard sorting.
- Deterministic Codeforces Elo rating algorithm with 60-iteration bisection and zero-sum conservation.
