# Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and [Conventional Commits](https://www.conventionalcommits.org/).

## 1.0.0 (2026-10-31)


### Features

* initial commit of Dagna (ዳኛ) online judge and contest platform ([aeb256d](https://github.com/PROFESSOR-ADNAN/dagna/commit/aeb256daf6f0419a37481dc119e8153164928142))

## [1.0.0] - 2026-11-01

### Added
- **Core Architecture:** Split Core host and Judge fleet over WireGuard private tunnels.
- **Judge Fleet:** Pull-based job claiming with generation fencing tokens, lease renewal, and borderline re-run stabilization.
- **Multi-layered Sandbox:** Linux namespaces (User, PID, Mount, Net, IPC, UTS), cgroup v2 accounting (cpu, memory, pids), drop capabilities, rlimits, seccomp filters.
- **Language Support:** GNU C++20/C++23, Python 3.12, Node.js 22 LTS, OpenJDK 21 LTS.
- **Checkers:** Exact, lines, tokens, float with epsilon, and testlib-compatible custom checkers.
- **Scoreboard Engine:** ICPC mode (penalty minutes) and OI mode (partial test groups) with bit-packed integer rank keys and freeze support.
- **Rating Engine:** Deterministic Codeforces-style Elo rating recalculation with logistic bisection and zero-sum conservation.
- **Web UI:** React SPA with Vite, Tailwind CSS, TanStack Query/Table, CodeMirror 6, KaTeX, and bilingual UI (English & Amharic አማርኛ).
- **Security & Threat Model:** Hostile test corpus, ASVS Level 2 compliance checklist, STRIDE analysis.
