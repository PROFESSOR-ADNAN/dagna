# ADR 0011: Problem Package Format and Sandboxed Validation

## Status
Accepted

## Context
Uploaded problem archives are untrusted ZIP files submitted by problem setters. Processing archives on the Core Host poses critical security risks (Zip-slip path traversal, symlink attacks, ZIP bombs, unvalidated scripts).

## Decision
1. **Direct-to-S3 Upload:** Problem setters request a presigned S3 PUT URL limited to 200 MB. The file uploads directly to S3 without passing multipart chunks through Core Host Express processes.
2. **Untrusted Extraction in Sandbox:** The raw package is claimed by a Judge Node and extracted **inside an unprivileged sandbox container with no network**.
3. **Safety Validations:**
   - Path normalization checking: rejects paths with `..`, absolute paths, symlinks, hardlinks, FIFOs, and device nodes.
   - Decompression ratio limits: rejects archives expanding > 10x the compressed size or > 1 GB total uncompressed.
4. **Validation Pipeline on Judge:**
   - Validates `problem.yaml` schema against strict Zod definitions.
   - Compiles and runs `validator.cpp` on every input test file.
   - Compiles model solutions (`ac.cpp`, `wa.py`, `tle.cpp`) and verifies that each solution produces its exact expected verdict against all test cases.
   - Runs `checker` on jury answers to verify that the official output satisfies the checker.
   - Computes suggested time limits: `timeLimit = ceil(3 * maxModelSolutionCpuTime)`.
   - Normalizes test inputs/outputs, calculates SHA-256 content hashes, uploads immutable blobs to S3, and returns a manifest to Core.
5. **Immutability:** Once published, problem versions are immutable. New updates create a new version (`version + 1`).
