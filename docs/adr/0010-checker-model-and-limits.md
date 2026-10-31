# ADR 0010: Checker Execution Model, Built-in Verifiers, and Testlib Custom Checkers

## Status
Accepted

## Context
Problems range from standard integer outputs to floating point numbers with specified epsilon tolerance, multiple valid answers (e.g. graph paths), and complex game theory outputs. We require both ultra-fast built-in comparison routines and support for testlib-style custom C++ checkers.

## Decision
1. **Built-in Checkers (In-Process Fast Path):**
   - `exact`: Byte-for-byte exact equality.
   - `lines`: Per-line comparison ignoring trailing carriage returns and spaces.
   - `tokens`: Whitespace-separated token comparison.
   - `float`: Token-by-token comparison checking if `abs(a - b) <= eps || abs(a - b) / max(1.0, abs(b)) <= eps`. Rejects `NaN`, `+Infinity`, and `-Infinity` as WA.
2. **Custom Checkers (testlib.h Sandbox Runner):**
   - Setter packages provide `checker.cpp`.
   - The checker is compiled in the sandbox on the Judge Host during package validation.
   - During evaluation, the compiled checker runs in an isolated sandbox with arguments: `<input_file> <participant_output_file> <jury_answer_file>`.
   - Checker limits: 10.0s CPU time, 512 MB memory limit, network disabled.
   - Exit codes map directly:
     - `0`: Accepted (AC)
     - `1`: Wrong Answer (WA)
     - `2`: Presentation Error / Output Format (mapped to WA)
     - `3` or crash: System Error (SE), alerting operators. A checker crash is NEVER penalized as participant fault.
