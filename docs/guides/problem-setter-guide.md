# Dagna (ዳኛ) Problem Setter Guide

## 1. Problem Package Format
A problem package is a standard ZIP archive containing:
- `problem.yaml`: problem metadata, limits, scoring mode, and test grouping.
- `statements/en.md`: Markdown statement in English (supports KaTeX math `$x_i \le 10^9$`).
- `statements/am.md`: Optional Markdown statement in Amharic (አማርኛ).
- `tests/`: Input files (`01.in`, `02.in`, ...) and official answers (`01.ans`, `02.ans`, ...).
- `solutions/`: Model solutions with expected verdicts (e.g. `ac.cpp`, `wa.py`, `tle.cpp`).
- `checker.cpp`: Optional testlib-compatible custom checker.
- `validator.cpp`: Optional testlib-compatible test case input format validator.

## 2. Sandboxed Validation
Uploaded packages are never extracted on the Core Host. A Judge Node claims the package and validates it inside an isolated sandbox:
1. Path traversal and zip bombs are rejected.
2. The validator runs against every test input.
3. Every model solution is compiled and evaluated against all test cases, verifying that `ac.cpp` achieves AC, `wa.py` triggers WA, and `tle.cpp` triggers TLE.
4. Suggested CPU time limit is calibrated as `3 * max(modelSolutionCpuTime)`.
