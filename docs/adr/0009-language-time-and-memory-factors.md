# ADR 0009: Language Time and Memory Scaling Factors

## Status
Accepted

## Context
Interpreted or managed runtimes (Python 3, Node.js, Java) exhibit inherent execution and runtime memory overheads compared to compiled GNU C++. Without calibrated factors, problem setters would have to craft language-specific time limits for every problem.

## Decision
We enforce standard time limit multipliers and memory allowances:

| Language | Identifier | Compiler/Runtime | Time Factor | Memory Allowance | Max PIDs |
|---|---|---|---|---|---|
| **C++** | `cpp` | GCC 13.3+ (std=c++20, -O2) | 1.0x | +0 MB | 32 |
| **Python** | `python` | CPython 3.12 (`-S -B`) | 2.5x | +32 MB | 32 |
| **Java** | `java` | OpenJDK 21 LTS (`-XX:+UseSerialGC`) | 2.0x | +64 MB | 64 |
| **JavaScript** | `javascript` | Node.js 22 LTS (`--max-old-space-size`) | 2.0x | +48 MB | 48 |

The effective CPU time limit for a submission is:
`effectiveTimeLimit = ceil(problemBaseTimeLimitMs * language.timeFactor)`

The effective memory limit is:
`effectiveMemoryLimit = problemBaseMemoryLimitMB + language.memoryAllowanceMB`
