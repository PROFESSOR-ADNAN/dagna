# ADR 0018: Authentication, Refresh Token Rotation, and Multi-Factor Auth (MFA)

## Status
Accepted

## Context
Web security standards require short-lived access tokens, secure session management, and resistance to token theft and replay attacks, with mandatory MFA for privileged roles (admin, organizer).

## Decision
1. **Password Hashing:**
   Argon2id (or bcrypt with salt rounds >= 12). Passwords have `select: false` on the User Mongoose schema.
2. **Access Token:**
   Signed stateless JWT (15-minute expiration) delivered in memory / Authorization header.
3. **Refresh Token Rotation:**
   Stored as SHA-256 hash in MongoDB (`refreshTokens` collection with TTL index).
   Delivered to browser via `httpOnly`, `Secure`, `SameSite=Strict` cookie (`dagna_refresh`).
   Every refresh request issues a new token pair and invalidates the previous refresh token.
4. **Token Family Reuse Detection:**
   If an invalidated refresh token is presented, the system treats it as token theft, immediately revokes the **entire family** of tokens for that user session, logs a security warning, and forces re-login.
5. **MFA (TOTP):**
   Mandatory for `admin` and `organizer` accounts before privileged actions can be performed. Supported via RFC 6238 TOTP algorithms.
