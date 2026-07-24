# Gateway architecture decisions

## Why Kong DB-less mode

We chose DB-less (declarative) mode over Kong with PostgreSQL because:

1. **No extra database to manage** — Kong with DB needs its own Postgres, with backups, replication, migrations, etc.
2. **Config in git** — `kong.yml` is version-controlled, code-reviewed, rollback-able
3. **Reproducible** — same config = same gateway state, anywhere
4. **Simpler ops** — no Admin API state drift, no DB schema migrations
5. **Better for small teams** — no need for runtime route management UI

We'll switch to Kong with DB only if we need:
- Multiple teams managing routes independently
- A non-developer-friendly UI for route management (Konga)
- Dynamic route creation from another service
- Kong Enterprise features

## Why a custom JWT verifier plugin (vs Kong's built-in JWT plugin)

Kong has a built-in JWT plugin, but it has limitations:
- Stores HS256 secrets per-consumer in Kong (we use RS256 with JWKS)
- Doesn't fetch JWKS automatically (we'd need to manually update keys)
- Doesn't forward custom user claims to upstream services in the way we need

Our custom `jwt-verifier`:
- Fetches JWKS dynamically from auth-service
- Caches keys for 1 hour
- Validates signature, expiration, issuer
- Checks role requirements per-route
- Injects `X-User-ID`, `X-User-Email`, `X-User-Role` headers downstream
- Returns helpful error messages with request IDs for debugging

## Trust boundary: gateway is the ONLY thing that sets X-User-* headers

Critical security model:
- Public network → gateway: clients can send anything, including spoofed `X-User-ID`
- **Gateway strips all incoming `X-User-*` headers** and replaces them with verified values from the JWT
- Gateway → internal network: services trust `X-User-*` headers because only the gateway can reach them
- Internal services should never be exposed to the public internet

This is enforced by:
1. Docker network isolation (only gateway has port mapping)
2. Production firewall rules
3. Gateway plugin that strips/overrides identity headers

If an attacker could reach internal services directly, they could impersonate any user. This is why the firewall config is as important as the gateway config.

## Why Redis-backed rate limiting in production

In dev: `policy: local` — each Kong replica counts independently. Fine for one container.

In production: `policy: redis` — all Kong replicas share a single counter via Redis.

Without Redis: if you have 3 Kong replicas and a 60/min limit, attackers effectively get 180/min because each replica counts separately.

## Caching strategy

We cache GET responses for read-heavy public endpoints:
- `/api/v1/medicines` — 60s in dev, 300s in prod
- `/api/v1/categories` — same
- `/api/v1/search` — same

Why these and not others:
- Medicine catalog data changes rarely (sellers add stock occasionally)
- These are the highest-volume endpoints (browsing/searching)
- Stale data for 5 minutes is acceptable

We do NOT cache:
- User-specific data (profile, cart, orders) — changes per user, not safe
- Authenticated requests — could leak data between users
- Any POST/PUT/DELETE — those are writes

## Future considerations

When we outgrow this setup:
- Move to Kong Hybrid mode (control plane + data plane) for multi-region
- Add Kong's WAF plugin for OWASP Top 10 protection
- Add OAuth2 plugin if we add third-party integrations
- Consider mTLS between gateway and internal services
- Add request/response transformation plugins for API versioning
