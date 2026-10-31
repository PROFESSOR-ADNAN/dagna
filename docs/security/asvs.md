# OWASP ASVS Level 2 Verification Matrix

| ASVS Section | Control Description | Status | Architectural Evidence |
|---|---|---|---|
| **V1: Architecture** | Multi-tiered architecture with distinct trust boundaries | **PASS** | 2-host split: Core Host (Zone 2) and Judge Host (Zone 3) over WireGuard. Sandbox in Zone 4. |
| **V2: Authentication** | Secure password storage & brute-force defense | **PASS** | Bcrypt cost 12 with `select: false`. Generic credentials failure message. 5-attempt lockout for 15m. |
| **V3: Session Mgmt** | Short-lived tokens & refresh rotation with reuse detection | **PASS** | 15-min JWT access token; 7-day refresh token rotated on every use; entire token family revoked on reuse. |
| **V4: Access Control** | Principle of least privilege & role verification | **PASS** | `requireRole` middleware checks DB on every request. Group privacy enforced (`404` for non-members). |
| **V5: Validation** | Strict input validation on all routes | **PASS** | Strict Zod validation schemas for all inputs; unknown fields stripped; bounded lengths. |
| **V6: Cryptography** | Secure random generation & standard cryptographic primitives | **PASS** | SHA-256 for content addressing & token hashing; Node native `crypto.randomBytes(40)`. |
| **V8: Data Protection** | Sensitive data scrubbed from logs | **PASS** | Source code, test cases, passwords, and tokens redacted from Pino and Nginx access logs. |
| **V14: Configuration** | Secure headers and container hardening | **PASS** | Helmet headers with strict CSP, HSTS, X-Frame-Options; non-root user execution. |
