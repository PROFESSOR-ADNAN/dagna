# Dagna (ዳኛ) Technology Stack & Component Specifications

All dependencies and components are confirmed stable, actively maintained, and free of end-of-life status.

## 1. Core Backend & Runtimes

| Component | Selected Version | Maintenance Status | Purpose & Justification |
|---|---|---|---|
| **Node.js** | `v22 LTS` (v22.10+) | Active LTS (confirmed maintained) | Fast async runtime for API, workers, and judge agent daemon. |
| **Express.js** | `4.21.x` | Stable (confirmed maintained) | Lightweight, predictable HTTP framework without NestJS or Passport bloat. |
| **Mongoose** | `8.8.x` | Active (confirmed maintained) | Robust MongoDB ODM with transaction and change-stream support. |
| **MongoDB** | `7.0 LTS` | Active (confirmed maintained) | Source of truth database with single-node replica set for ACID transactions. |
| **Redis** | `7.2.x` | Active (confirmed maintained) | High-speed cache, scoreboard snapshot store, and BullMQ backend. |
| **BullMQ** | `5.25.x` | Active (confirmed maintained) | Durable Redis-backed queue for background workers and schedulers. |
| **Zod** | `3.23.x` | Active (confirmed maintained) | Strict runtime schema validation for APIs, configs, and job messages. |
| **Pino** | `9.5.x` | Active (confirmed maintained) | High-throughput structured JSON logging with redaction. |

## 2. Sandbox, Judge Runtime & Toolchains

| Tool / Language | Version | Maintenance Status | Purpose & Configuration |
|---|---|---|---|
| **Linux Namespaces** | Kernel 6.8+ / 7.0+ | Native Linux Kernel | User, PID, Mount, Net, IPC, UTS isolation layers. |
| **cgroup v2** | Native Linux v2 | Active Standard | Hard CPU quota, memory.max limits, and accurate peak tracking. |
| **GNU C++** | `GCC 13.3+ / 14.x` | Active (GNU standard) | C++20 / C++23 standard support (`-O2 -std=c++20`). |
| **Python** | `CPython 3.12.x` | Active (Python PSF) | Minimal environment execution with `-S -B`. |
| **Java** | `OpenJDK 21 LTS` | Active LTS | Managed JVM execution with `-XX:+UseSerialGC`. |
| **JavaScript** | `Node.js 22 LTS` | Active LTS | V8 runtime with `--max-old-space-size`. |
| **testlib.h** | `v0.9.33+` | Active (Mike Mirzayanov) | De-facto standard for Olympiad custom checkers and validators. |
| **WireGuard** | `v1.0+` | Native Linux Kernel | Encrypted tunnel linking Core Host and Judge Host. |

## 3. Frontend Web Client

| Component | Selected Version | Maintenance Status | Purpose |
|---|---|---|---|
| **React** | `18.3.x` | Active | Component UI architecture. |
| **Vite** | `6.0.x` | Active | Next-generation frontend bundler with sub-second HMR. |
| **Tailwind CSS** | `3.4.x` | Active | Utility-first responsive styling and typography. |
| **TanStack Query** | `5.62.x` | Active | Client-side async state caching and polling fallbacks. |
| **TanStack Table** | `8.20.x` | Active | High-performance virtualized contest standings table. |
| **CodeMirror 6** | `6.x` | Active (confirmed maintained) | Modular, accessible code editor with syntax highlighting and memory draft saving. |
| **KaTeX** | `0.16.x` | Active (confirmed maintained) | Blazing-fast math typesetting for problem statements. |
| **Dexie.js** | `4.0.x` | Active | IndexedDB wrapper for offline code drafts and resilient submission queue. |
| **react-i18next** | `15.1.x` | Active | Localization for English and Amharic (አማርኛ) UI strings. |

## 4. DevOps, Observability & Security

| Tool | Version | Maintenance Status | Purpose |
|---|---|---|---|
| **Nginx** | `1.26.x / 1.27.x` | Active Mainline | Reverse proxy, TLS termination, SSE unbuffered streaming. |
| **Prometheus** | `2.55.x` | Active (CNCF) | High-resolution metric scraping with strict cardinality rules. |
| **Alertmanager** | `0.27.x` | Active (CNCF) | Alert routing, grouping, and notification dispatch. |
| **Grafana** | `11.3.x` | Active | Visual dashboarding for fleet health, queue depth, and SLOs. |
| **Loki + Grafana Alloy** | `3.2.x / 1.5.x` | Active (Replaces Promtail) | Structured log aggregation with tunnel-secured shipping. |
| **OpenTofu / Terraform** | `v1.8+` | Active (Linux Foundation) | Declarative Infrastructure as Code for VPS and networking. |
| **Ansible** | `2.17+` | Active (Red Hat) | Idempotent server provisioning and hardening. |
| **gitleaks** | `8.18+` | Active | Secret scanning in pre-commit and CI. |
| **k6** | `0.54+` | Active (Grafana Labs) | Scriptable load and stress testing for contest profiles. |
