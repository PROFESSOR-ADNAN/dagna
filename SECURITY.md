# Security Policy

## Reporting Security Issues

Security is paramount to Dagna. Since the platform executes untrusted code submitted by third parties, we treat sandbox isolation, kernel confinement, and isolation integrity as critical tier-0 priorities.

If you believe you have discovered a vulnerability (including potential sandbox bypasses, lease/fencing flaws, or data leakage of hidden contest test sets), please disclose responsibly:

- **Email:** `security@dagna.dev` (or the repository maintainers)
- **PGP Key:** Available upon request or via `/.well-known/security.txt`

Please do NOT file public GitHub issues for security vulnerabilities.

## Scope & Vulnerability Classifications

- **SEV1 (Critical):** Sandbox escape to host, host container compromise, execution of untrusted code on the core host, or leakage of hidden contest test data prior to problem publication.
- **SEV2 (High):** Scoreboard manipulation, bypass of generation fencing tokens, authentication or authorization bypass.
- **SEV3 (Medium):** Denial of service within sandbox time/memory constraints, non-isolated rate limiting issues.
