# ADR 0001: Two-Host Topology (Core Host + Judge Host)

## Status
Accepted

## Context
Dagna executes untrusted, potentially malicious code submitted by arbitrary public users in competitive programming contests and practice. Hosting the database (which stores user credentials, submissions, and contest data) and Redis on the same physical or virtual host executing untrusted code exposes the entire platform to privilege escalation, container escapes, and kernel-level vulnerabilities (SEV1 threat).

## Decision
We deploy Dagna on two dedicated virtual private servers (VPS):
1. **Core Host (2 vCPU / 4 GB RAM):** Hosts Nginx, public REST API, BullMQ worker, scheduler, MongoDB single-node replica set, Redis, and observability collectors. Budget: Hetzner Cloud CX22 (~€3.79 / ~$4.15/mo) or OVH / DigitalOcean equivalent (~$12-$20/mo).
2. **Judge Host (4 vCPU / 8 GB RAM):** Hosts only the `judge-agent` daemon, the sandbox supervisor, compiler toolchains, and a local LRU cache. It has **no public ports open**, no public database credentials, and no network route to MongoDB or Redis. It connects to the Core Host exclusively through an encrypted private WireGuard tunnel (`10.100.0.0/24`). Budget: Hetzner Cloud CPX31 (4 vCPU / 8 GB RAM, ~$15.50/mo).

Total hosting cost is ~$20-$35/mo, well within the $40/mo ceiling.

## Alternatives Considered
- *Single-Host Deploy:* Lower cost (~$15/mo), but unacceptable security posture. A kernel exploit (e.g. dirty COW, eBPF bugs) grants immediate root access to the database and secrets.
- *Kubernetes Cluster:* Overhead of K8s control plane requires at least 3 nodes and >$100/mo, violating budget and complexity constraints.

## Consequences
- The Core Host and Judge Host must be configured independently via Ansible.
- Communication between Judge and Core must rely on a pull-based WireGuard gateway interface.
- Adding additional judge nodes scales linearly by provisioning another Judge VPS and authorizing its node public key in WireGuard.
