# Auth Service

Authentication and authorization microservice for the medicine e-commerce platform. Built with **NestJS + TypeORM + PostgreSQL**.

## Features

- User registration with email verification
- Login with bcrypt password hashing
- RS256 JWT access tokens + opaque refresh tokens with rotation
- JWKS endpoint for API gateway (Kong) consumption
- Refresh token reuse detection (revokes entire token family on misuse)
- Two-factor authentication (TOTP) with backup codes
- Account lockout after 5 failed login attempts (configurable)
- Password reset via email
- Role-based access control (customer / seller / rider / admin)
- Session management with device tracking
- Audit log of all auth events
- RabbitMQ event publishing for cross-service communication
- Prometheus metrics, structured JSON logging, health checks
- Rate limiting on sensitive endpoints

## Folder structure

```
auth-service/
├── src/
│   ├── config/                   App, database, JWT, infrastructure config
│   ├── common/
│   │   ├── decorators/           @Public, @Roles, @CurrentUser, @IpAddress
│   │   ├── filters/              Global exception filter
│   │   ├── guards/               JwtAuthGuard, RolesGuard
│   │   ├── interceptors/         Metrics interceptor
│   │   └── utils/                Crypto, hashing, time helpers
│   ├── database/
│   │   ├── data-source.ts        TypeORM data source for migrations
│   │   └── migrations/           Schema migrations
│   ├── modules/
│   │   ├── auth/                 Main auth orchestrator + controller + DTOs
│   │   ├── users/                User entity & service
│   │   ├── tokens/               Refresh + verification tokens
│   │   ├── sessions/             Session management
│   │   ├── two-factor/           TOTP 2FA
│   │   ├── email/                Email sending
│   │   ├── events/               RabbitMQ publisher
│   │   ├── audit/                Audit log
│   │   ├── jwks/                 JWKS endpoint for Kong
│   │   ├── health/               /health and /ready endpoints
│   │   └── metrics/              /metrics endpoint
│   ├── app.module.ts
│   └── main.ts
├── keys/                         RSA keys (generated, gitignored)
├── scripts/
│   └── generate-keys.js          Creates RSA key pair
├── test/                         E2E tests
├── Dockerfile                    Multi-stage build
├── .env.example
└── package.json
```

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Generate RSA keys for JWT signing

```bash
npm run keys:generate
```

This creates `keys/private.pem` (signs tokens) and `keys/public.pem` (Kong uses this to verify). The keys are gitignored — commit only `keys/.gitkeep`.

### 3. Set up environment

```bash
cp .env.example .env
```

Edit `.env` if running locally. Defaults work with the project's docker-compose.

### 4. Start dependencies (Postgres, Redis, RabbitMQ)

From the project root:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d \
  postgres-auth redis rabbitmq
```

### 5. Run migrations

```bash
npm run migration:run
```

### 6. Start the service

```bash
npm run start:dev
```

Service runs on `http://localhost:3001`. Swagger docs at `http://localhost:3001/docs` (dev only).

## API endpoints

All endpoints prefixed with `/api/v1`.

### Public (no auth required)

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Log in (returns 2FA challenge if enabled) |
| POST | `/auth/refresh` | Exchange refresh token for new access token |
| POST | `/auth/verify-email` | Verify email with token |
| POST | `/auth/resend-verification` | Resend verification email |
| POST | `/auth/forgot-password` | Request password reset email |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/.well-known/jwks.json` | Public keys (Kong fetches this) |

### Protected (JWT required)

| Method | Path | Purpose |
|---|---|---|
| GET | `/auth/me` | Current user profile |
| POST | `/auth/logout` | Revoke current session + refresh token |
| PUT | `/auth/change-password` | Change password (revokes all sessions) |
| POST | `/auth/2fa/setup` | Generate 2FA secret + QR code |
| POST | `/auth/2fa/enable` | Confirm and activate 2FA |
| DELETE | `/auth/2fa` | Disable 2FA (requires password + code) |

### Operational (no auth)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check (always 200 if running) |
| GET | `/ready` | Readiness check (verifies DB connectivity) |
| GET | `/metrics` | Prometheus metrics |
| GET | `/docs` | Swagger UI (dev only) |

## How tokens work

### Access token (JWT)
- Signed with RS256 using `keys/private.pem`
- Short-lived (15 minutes default)
- Contains: `sub` (user id), `email`, `role`, `sessionId`, `iss`, `aud`, `exp`, `iat`, `jti`
- Verified by Kong gateway using public key from JWKS endpoint
- Never stored — stateless

### Refresh token (opaque)
- Random 48-byte token, NOT a JWT
- Long-lived (7 days default)
- Stored hashed in `refresh_tokens` table
- Family-tracked for reuse detection
- Rotated on every use — old token revoked, new one issued
- If a revoked token is presented, the entire family is revoked (likely theft)

## Refresh token rotation flow

```
1. User logs in → access token + refresh token A (family F1)
2. Access expires, client sends refresh token A
3. Server verifies A is valid + not revoked
4. Server issues new pair: access + refresh token B (still family F1)
5. Token A marked as revoked, replaced_by = B
6. Next refresh: client sends B → issues C, revokes B

If attacker steals A and uses it AFTER B was issued:
- A is already revoked → reuse detected
- ALL tokens in family F1 revoked
- User forced to log in again
```

## Events published

All events published to RabbitMQ exchange `user.events` (topic):

| Routing key | When |
|---|---|
| `user.registered` | New user signs up |
| `user.email.verified` | Email verification completed |
| `user.login` | Successful login |
| `user.logout` | User logs out |
| `user.password.changed` | Password changed (authenticated) |
| `user.password.reset` | Password reset via email |
| `user.account.locked` | Too many failed logins |

Other services (report-service, etc.) subscribe to these.

## Operational commands

```bash
# Generate a new migration after entity changes
npm run migration:generate -- src/database/migrations/AddNewColumn

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Coverage
npm run test:cov

# Linter
npm run lint
```

## Production checklist

- [ ] Generate fresh RSA keys, never reuse dev keys
- [ ] Store private key in a secret manager, mount as file
- [ ] Use real SMTP credentials (SES, Mailgun, SendGrid)
- [ ] Set strong `JWT_SECRET` (not used here since RS256, but keep secrets in vault)
- [ ] Set `BCRYPT_ROUNDS=12` (or higher if you can afford latency)
- [ ] Enable `synchronize: false` (always — never auto-sync schema)
- [ ] Tighten CORS to actual domains
- [ ] Run behind Kong gateway, never expose directly
- [ ] Set up alerts on `auth_account_lockouts_total` and `http_requests_total{status=~"5.."}`
- [ ] Rotate keys periodically (add new `kid`, deprecate old)

## Integration with Kong

Kong's `jwt-verifier` plugin fetches `http://auth-service:3001/.well-known/jwks.json` and uses those public keys to verify access tokens. When a token is valid, Kong forwards these headers to downstream services:

- `X-User-ID` — from `sub` claim
- `X-User-Email` — from `email` claim
- `X-User-Role` — from `role` claim
- `X-Request-ID` — Kong-generated correlation ID

Downstream services trust these headers because they only come from Kong (internal network only).

## Troubleshooting

**"Failed to load RSA keys"** — Run `npm run keys:generate`.

**"Email verification failed: token invalid"** — Tokens expire in 24h. User must request a new one via `/auth/resend-verification`.

**"Account locked"** — 5 failed logins triggers a 30-minute lockout. Lockout config in `.env`.

**Refresh token reuse detected** — Either user is using an old token (clock skew, retry logic) or token was stolen. Either way, all sessions revoked, user must log in.

**RabbitMQ connection issues** — Service starts even if RabbitMQ is down (uses connection manager with retry). Events queue up locally and publish when reconnected.
