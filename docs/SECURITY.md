
# Security

This document summarizes security decisions and recommendations for `my-node-app`.

## Principles
- Keep secrets out of the repository and version control. Use a secrets manager (Vault, AWS Secrets Manager, Azure Key Vault, etc.).
- Fail fast on startup if critical environment variables are missing in production.
- Defense in depth: input validation, strong authentication, safe logging, and rate limiting.

## Important environment variables
- `JWT_SECRET` — required in `NODE_ENV=production`. Do not use insecure defaults.
- `JWT_EXPIRES_IN` — token expiration (e.g. `1h`).
- `JWT_ISSUER`, `JWT_AUDIENCE` — values used to validate incoming tokens.
- `REDIS_URL` — when set, revoked tokens are stored in Redis.
- `PASSWORD_SALT_ROUNDS` — bcrypt cost factor (configurable).

## JWT
- Tokens contain minimal claims: `sub` (user id) and `jti` (JWT ID) to allow revocation.
- Token verification validates signature, algorithm (HS256 by default), `issuer` and `audience`.
- For distributed systems consider asymmetric algorithms (RS256) and key rotation using `kid`.

## Token revocation (logout)
- In development the project uses an in-memory revocation list; in production use `REDIS_URL` and Redis with TTL.
- Revocations naturally expire when the token would have expired.

## Passwords
- Passwords are stored using `bcrypt`.
- Set `PASSWORD_SALT_ROUNDS` in production (recommended ≥12, balancing cost/latency).

## Input validation
- Authentication and resource update endpoints apply basic validation for format and length.
- Consider adding strict schemas (e.g. `Joi` or `ajv`) per route and limit body size (`express.json({ limit: '1mb' })`).

## Abuse protection
- `express-rate-limit` is applied with strict limits on auth endpoints (e.g. 10 attempts / 15min per IP).
- Adjust limits according to real traffic patterns.

## Logging and privacy
- Do not log passwords or tokens in plaintext. The logger redacts sensitive fields (`password`, `token`, `authorization`, etc.).
- For 5xx errors in production the client receives a generic message while details remain in internal logs.

## Dependencies and patches
- Run regular dependency audits (`pnpm audit`, SCA) and keep dependencies up to date.

## Pre-production checklist
1. Ensure `JWT_SECRET` is configured and managed by a secret manager.
2. Set `REDIS_URL` and verify connectivity if the app runs across multiple instances.
3. Tune `PASSWORD_SALT_ROUNDS` and test latency impact.
4. Set `LOG_LEVEL=info` in production and configure a log collector.
5. Enable HTTPS and configure CORS/Content Security Policy according to your client.

## Incidents & rotation
- If `JWT_SECRET` or keys are compromised, rotate secrets and force revocation (consider adding `kid` validation or changing `issuer`/`audience`).

## Reporting
Report vulnerabilities to the repository maintainers via issues or a secure channel.

---

This file complements the implementation and should be kept in sync with code changes.
