# Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and [Conventional Commits](https://www.conventionalcommits.org/).

## 1.0.0 (2026-11-14)


### Features

* **auth:** add phone and email verification via AfroMessage SMS and Gmail SMTP ([5b0ca2d](https://github.com/PROFESSOR-ADNAN/dagna/commit/5b0ca2dee0bed79fe59e6543d7b687293c1cbd3d))
* **config:** support MONGO_URI, REDIS_URI, and CHAPA_ENCRYPTION_KEY aliases ([d015c1e](https://github.com/PROFESSOR-ADNAN/dagna/commit/d015c1e8e53580b6cc6923f34db4efd7316e12e3))
* **deploy:** configure Vercel, Render blueprint, Redis URL support, and Chapa payment integration ([e878ffe](https://github.com/PROFESSOR-ADNAN/dagna/commit/e878ffea72ee47ca2acc96626aab47cfa78ed419))
* initial commit of Dagna (ዳኛ) online judge and contest platform ([aeb256d](https://github.com/PROFESSOR-ADNAN/dagna/commit/aeb256daf6f0419a37481dc119e8153164928142))
* **webhook:** capture rawBody and support x-chapa-signature HMAC verification ([7ef5161](https://github.com/PROFESSOR-ADNAN/dagna/commit/7ef5161ea81ac5428e466896da54575ae9df1a49))


### Bug Fixes

* **build:** add types to dependencies, update render.yaml build command, and set https://dagna-api.onrender.com ([d8e2e8c](https://github.com/PROFESSOR-ADNAN/dagna/commit/d8e2e8ccb10df6e5ca33916e88c6a7d3f824d3bd))

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
