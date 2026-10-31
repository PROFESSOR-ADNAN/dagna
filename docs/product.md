# Dagna (ዳኛ) Product Specification & Requirements

## 1. Executive Summary
Dagna is an industrial-strength, production-grade online judge and contest platform designed for competitive programmers, problem setters, and contest organizers. It provides millisecond-accurate code execution inside multi-layered Linux sandboxes, pull-based judge fleet coordination, real-time frozen scoreboards for ICPC and OI contest styles, and deterministic Codeforces-style Elo rating recalculations.

## 2. User Roles
- **Competitive Programmer (User):** Solves archive problems, participates in timed contests, tracks rating evolution, inspects detailed submission breakdowns.
- **Problem Setter:** Creates and versions problems, prepares test suites and custom checkers, reviews sandboxed validation reports.
- **Organizer:** Organizes public or private group contests, configures scoreboard freezes, answers clarifications, triggers rejudges.
- **Administrator:** Manages the judge node fleet (drain, pause, quarantine), monitors queue latency, reviews audit logs.

## 3. User Stories & Acceptance Criteria

### Security & Sandbox
1. **US01 - Hostile Fork Bomb Containment:**
   *As an admin, I want a program that launches infinite background forks to be terminated immediately so that the judge host remains responsive.*
   - **AC:** A fork bomb process tree hits `pids.max = 64` or TLE within 3.0 seconds, receives RE or TLE, the entire cgroup is terminated, and the judge node claims the next job with zero leaked processes.
2. **US02 - Filesystem Access Denial:**
   *As a setter, I want user programs strictly forbidden from reading test archives or system files so that hidden data is never leaked.*
   - **AC:** Any attempt to read `/etc/shadow`, `/proc/kcore`, or paths outside the read-only sandbox mount raises RE or a permission denial; zero sensitive file content reaches stdout/stderr.
3. **US03 - Network Air-gap Isolation:**
   *As an operator, I want all user executions completely isolated from the network so that participants cannot exfiltrate test cases or attack external endpoints.*
   - **AC:** Sockets fail with `ENETUNREACH` or `EPERM`. Connection attempts to localhost, private WireGuard IPs, or cloud metadata `169.254.169.254` fail immediately.
4. **US04 - Bounded Output Protection:**
   *As an operator, I want programs that generate infinite stdout/stderr to be bounded so that memory and disk are never saturated.*
   - **AC:** Output exceeding 16 MB is truncated, terminated with verdict `OLE` (Output Limit Exceeded), and client response displays max 4 KB error snippet.
5. **US05 - Clean Post-Execution Hygiene:**
   *As an operator, I want the judge agent to verify process, mount, and cgroup cleanup after every run so that no residue lingers.*
   - **AC:** Post-run hygiene check asserts 0 processes in cgroup, scratch tmpfs deleted, and cgroup directory removed. If hygiene fails, the node automatically enters `quarantined` state and fires a SEV1 alert.

### Submissions & Judging Protocol
6. **US06 - Fenced Stale Job Rejection:**
   *As an engineer, I want results submitted by delayed or zombie judge nodes with expired leases to be rejected so that stale verdicts never overwrite fresh results.*
   - **AC:** Core gateway checks monotonic `generation` token. A heartbeat or completion request with a stale generation receives `409 Conflict`, drops the job, and logs the incident.
7. **US07 - Exactly-Once Submission Processing:**
   *As a participant, I want my submission processed exactly once even if network retries occur.*
   - **AC:** Client passes `clientSubmissionId`. Repeated submissions with the same `(userId, clientSubmissionId)` return the existing submission record and trigger zero duplicate jobs.
8. **US08 - Borderline Re-run Fairness:**
   *As a competitor, I want executions close to the time limit re-evaluated to eliminate noise flips.*
   - **AC:** Runs within ±15% of the CPU limit are rerun up to 2 extra times, assigning the minimum CPU time.
9. **US09 - Submissions Durability on Redis Failure:**
   *As an operator, I want judging to proceed even if Redis restarts.*
   - **AC:** Job queue is maintained durably in MongoDB. Redis outage causes zero loss of unjudged submissions, falling back to 2-second MongoDB polling.
10. **US10 - Priority Aging Fairness:**
    *As a setter running package validations, I want background jobs to not be starved forever by practice submissions.*
    - **AC:** Jobs aging past 60 seconds are promoted one priority level automatically.

### Contests & Scoreboards
11. **US11 - ICPC Real-Time Penalty Calculation:**
    *As a contestant, I want my penalty calculated from contest start to submission receipt time.*
    - **AC:** Penalty is calculated as `floor((receivedAt - startAt) / 60000) + (penaltyMinutes * rejectedAttempts)` upon first AC.
12. **US12 - Scoreboard Freeze Confidentiality:**
    *As a participant, I want public standings frozen at `freezeAt` while I can still see my own submission outcomes.*
    - **AC:** Public spectators see the frozen snapshot. The authenticated user sees their actual status on their own row with "Pending" marks visible to others.
13. **US13 - OI Partial Score Accumulation:**
    *As an OI contestant, I want partial points awarded for passed subtask test groups.*
    - **AC:** Groups award points only when all subtask test cases pass. Prerequisite group failures mark dependent groups as `SKIPPED`.
14. **US14 - Server Monotonic Time Integrity:**
    *As an organizer, I want submission times based strictly on server receipt time.*
    - **AC:** Client clock alterations have zero impact on contest eligibility or penalty calculation.
15. **US15 - Rejudge Standings Recalculation:**
    *As an organizer, I want rejudging a problem to cleanly rebuild the scoreboard from source.*
    - **AC:** Standings cells are recalculated idempotently from underlying submissions without cumulative drift.

### Ratings & Leaderboards
16. **US16 - Deterministic Elo Rating Update:**
    *As a participant, I want my rating updated deterministically according to the official Codeforces formula.*
    - **AC:** Expected seeds, geometric target ranks, bisection, and zero-sum corrections run with integer floor rounding.
17. **US17 - Idempotent Rating Recomputation:**
    *As an admin, I want to recalculate all historical ratings from scratch and get bit-for-bit identical results.*
    - **AC:** `RatingRecompute` replays all finalized rated contests and produces 0 deviations from historical records.

### Groups & Collaboration
18. **US18 - Group Contest Privacy:**
    *As a university club coach, I want private contests visible only to members.*
    - **AC:** Non-members receive `404 Not Found` for group contest URLs and APIs.

## 4. Traceability Matrix

| Requirement | User Story | Automated Test Location |
|---|---|---|
| Fork bomb containment | US01 | `tests/sandbox/hostile/process/fork_bomb.test.mjs` |
| Filesystem confinement | US02 | `tests/sandbox/hostile/fs/path_traversal.test.mjs` |
| Network air-gap | US03 | `tests/sandbox/hostile/network/egress.test.mjs` |
| Output truncation & OLE | US04 | `tests/sandbox/hostile/output/flood.test.mjs` |
| Post-run hygiene check | US05 | `judge/src/sandbox/hygiene.test.ts` |
| Lease generation fencing | US06 | `tests/chaos/fencing.test.ts` |
| Client idempotency | US07 | `tests/integration/submission_idempotency.test.ts` |
| Borderline re-run band | US08 | `tests/determinism/borderline.test.ts` |
| Redis wipe durability | US09 | `tests/chaos/redis_wipe.test.ts` |
| Scoreboard reference model | US11, US13 | `tests/property/scoreboard.property.test.ts` |
| Scoreboard freeze | US12 | `tests/integration/contest_freeze.test.ts` |
| Rating invariants | US16, US17 | `tests/property/rating.property.test.ts` |
| Group contest isolation | US18 | `tests/integration/group_privacy.test.ts` |
