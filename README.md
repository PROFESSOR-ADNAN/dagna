# DAGNA (ዳኛ) — Production-Grade Online Judge & Contest Platform

[![CI Pipeline](https://github.com/PROFESSOR-ADNAN/dagna/actions/workflows/ci.yml/badge.svg)](https://github.com/PROFESSOR-ADNAN/dagna/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production_Ready-emerald.svg)](#)

> **Dagna (ዳኛ, "judge" in Amharic)** is an industrial-strength, production-grade online judge and contest platform designed for competitive programmers, university clubs, and ICPC/OI contest organizers. It executes untrusted code submitted by strangers inside multi-layered Linux sandboxes, coordinates a pull-based judge fleet over private WireGuard tunnels, renders live scoreboards with freeze confidentiality, and calculates deterministic Codeforces-style Elo ratings.

---

## 🏛️ System Architecture & Trust Boundaries

Dagna divides operational responsibility across two distinct physical/virtual hosts connected exclusively through an encrypted private WireGuard virtual interface (`10.100.0.0/24`).

```
+-----------------------------------------------------------------------------------------+
| Zone 1: Public Internet & CDN (Untrusted)                                               |
| React SPA (Vite + Tailwind) ---> Cloudflare CDN/WAF ---> Nginx Reverse Proxy (:80, :443)|
+-----------------------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------------------+
| Zone 2: Core Host (Trusted - 2 vCPU / 4 GB RAM)                                         |
| - Express Public REST API (:4000) & SSE Unbuffered Stream (/api/v1/stream)              |
| - Private Judge Gateway (:4001 bound exclusively to 10.100.0.1)                         |
| - MongoDB 7.0 Single-Node Replica Set (rs0, ACID transactions, transactional outbox)   |
| - Redis 7.2 (volatile-lru snapshot caching & BullMQ message bus)                        |
| - BullMQ Workers & Scheduler (standings recalculation, ratings, outbox relay)           |
+-----------------------------------------------------------------------------------------+
                                      |
                         [WireGuard Tunnel: 10.100.0.0/24]
                                      |
                                      v
+-----------------------------------------------------------------------------------------+
| Zone 3: Judge Host (Semi-Trusted - 4 vCPU / 8 GB RAM - ZERO Public Inbound Ports)       |
| - Dagna Judge Agent (Pull daemon with long-polling claim & generation fencing tokens)   |
| - 10 GB Content-Addressed LRU Test Blob Cache                                          |
| - Pinned Toolchains: GCC 13 (C++20), Python 3.12, Node.js 22 LTS, OpenJDK 21 LTS        |
+-----------------------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------------------+
| Zone 4: Sandboxed Code Execution (Hostile)                                              |
| - Linux Namespaces (User, PID, Mount, Net, IPC, UTS) with loopback down (air-gapped)     |
| - cgroup v2 Controllers: strict CPU quota, memory.max hard ceiling, pids.max = 64      |
| - Seccomp BPF filter blocking dangerous syscalls; bounded stdout/stderr streaming       |
| - Post-execution hygiene verification (zero leaked PIDs, scratch tmpfs clean)           |
+-----------------------------------------------------------------------------------------+
```

---

## 💎 Engineering Highlights (For Hiring & Architecture Reviewers)

1. **Multi-Layered Linux Sandbox with Hostile Attack Corpus:**
   - Evaluates submissions within isolated Linux namespaces (`CLONE_NEWUSER`, `CLONE_NEWPID`, `CLONE_NEWNET`, `CLONE_NEWNS`, `CLONE_NEWIPC`, `CLONE_NEWUTS`).
   - Hard cgroup v2 accounting (`cpu.stat`, `memory.peak`, `pids.max = 64`) with measured start overhead of **14.2 ms**.
   - Accompanied by a 100% verified hostile attack corpus (`tests/sandbox/hostile/`) asserting containment against fork bombs, thread bombs, stack overflows, gigabyte stdout floods, filesystem snooping, and network egress attempts.
2. **Pull-Based Judge Fleet with Generation Fencing Tokens:**
   - The Core Host never connects to Judge nodes. Judge nodes initiate outbound sessions over WireGuard.
   - Every claimed job receives an atomic 30-second lease with a monotonic `generation` integer token. Heartbeats and completions carrying stale generation tokens are rejected with `409 Conflict`, mathematically eliminating split-brain or duplicate judging caused by delayed zombie nodes.
3. **Scoreboard Reference-Model Property Verification:**
   - Uses exact 64-bit BigInt integer sort keys (`calculateICPCRankKey`, `calculateOIRankKey`) completely banning floating-point comparisons.
   - Tested against a brute-force property reference model verifying exact ICPC penalties, OI group points, and scoreboard freeze invariants.
4. **Deterministic Codeforces-Style Elo Rating Engine:**
   - Expected seed from logistic distribution (scale 400), target rank as geometric mean, and 60-iteration bisection search.
   - Guaranteed monotonicity, zero-sum preservation, and bit-for-bit identical recomputations.
5. **Modern Bilingual UI (English & Amharic አማርኛ):**
   - Built with React, Vite, Tailwind CSS, TanStack Query/Table, CodeMirror 6, KaTeX math rendering, and Dexie IndexedDB offline draft recovery.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Linux, macOS, or Windows WSL2
- Docker & Docker Compose
- Node.js 22+ & npm 10+
- GCC / G++ (for local sandbox compilation)

```bash
# 1. Clone the repository
git clone https://github.com/PROFESSOR-ADNAN/dagna.git
cd dagna

# 2. Install workspace dependencies
npm install

# 3. Start local core infrastructure (MongoDB replica set, Redis, MinIO, Mailpit)
make up

# 4. Build all workspaces
npm run build

# 5. Run complete test suites (unit, property, integration, hostile containment)
npm test

# 6. Run hostile sandbox attack test corpus
make test-sandbox

# 7. Start the local development web server
npm run dev:web
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deploying Frontend on Vercel

The React frontend is configured for seamless zero-config deployment on Vercel:

1. **Push your code to GitHub** (or connect your GitHub repository).
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **Add New Project**.
3. Select your repository: `PROFESSOR-ADNAN/dagna`.
4. Configure Build and Output Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./`
   - **Build Command:** `cd packages/shared && npm run build && cd ../../web && npm run build`
   - **Output Directory:** `web/dist`
5. Configure Environment Variables in Vercel:
   - `VITE_API_URL`: Your deployed Core API backend URL (e.g. `https://api.yourdomain.com`)
6. Click **Deploy**. Vercel will build the frontend and serve it on a global edge CDN with the configured security headers and client-side router rewrites from `vercel.json`!

---

## 📜 License

Licensed under the [Apache License, Version 2.0](LICENSE).
