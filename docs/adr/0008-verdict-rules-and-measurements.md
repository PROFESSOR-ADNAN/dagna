# ADR 0008: Verdict Rules, Borderline Re-run Band, and Resource Accounting

## Status
Accepted

## Context
Online judges frequently face borderline timing noise where non-deterministic CPU scheduling or cache misses cause a solution that takes 980 ms on a 1000 ms limit to occasionally fail with TLE. Additionally, memory measurement must distinguish between peak cgroup memory vs wall-clock timeout.

## Decision
1. **CPU Measurement:** Primary execution measurement is CPU time (`user + sys` time reported directly by cgroup v2 `cpu.stat`), NOT wall-clock time.
2. **Safety Net Wall-Clock:** Wall-clock limit is set to `max(2 * cpuLimit, cpuLimit + 2000ms)` solely to kill processes hung on blocking syscalls, sleeps, or deadlocks.
3. **Memory Measurement:** Peak memory is sampled directly from cgroup v2 `memory.peak`. If `memory.peak > memoryLimit` or a cgroup OOM kill event is detected, `MLE` (Memory Limit Exceeded) is issued immediately.
4. **Borderline Re-run Rule (±15% Band):**
   - If a test run completes within ±15% of the CPU time limit (e.g., between 850 ms and 1150 ms for a 1000 ms limit), the supervisor executes the test up to 2 additional times.
   - The test verdict is assigned using the **minimum measured CPU time** across the 3 attempts.
   - The number of borderline reruns is persisted in the judgment record for auditing.
   - This rule mathematically reduces random timing flips from ~5% to < 0.2%.
5. **Verdict Precedence (ICPC):**
   `CE` (Compile Error) > `TLE` (Time Limit Exceeded) | `MLE` (Memory Limit Exceeded) | `OLE` (Output Limit Exceeded) | `RE` (Runtime Error) > `WA` (Wrong Answer) > `AC` (Accepted).
   ICPC halts execution on the first non-AC test. OI mode executes all tests to compute partial scores.
