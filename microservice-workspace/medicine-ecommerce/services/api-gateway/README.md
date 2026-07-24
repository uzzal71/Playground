# API Gateway (Kong)

The single public entry point for the medicine e-commerce platform. All client traffic flows through here before reaching any internal service.

## What this gateway does

| Concern | How |
|---|---|
| Routing | Path-based routing to 7 microservices |
| Authentication | Custom JWT verifier plugin validates tokens against auth-service JWKS |
| Authorization | Role-based access (customer/seller/rider/admin) at the route level |
| Rate limiting | Per-IP and per-user limits, Redis-backed in production |
| CORS | Centralized — services don't worry about it |
| Request tracing | X-Request-ID injected and propagated to all downstream services |
| Caching | Proxy cache for read-heavy public endpoints |
| Security headers | HSTS, X-Frame-Options, CSP, etc. on every response |
| Metrics | Prometheus `/metrics` endpoint at port 8100 |
| Health checks | Active health checks on upstream services with circuit breaker |

## Folder structure

```
api-gateway/
├── config/
│   ├── kong.yml              Development configuration (DB-less)
│   └── kong.prod.yml         Production overrides
├── plugins/
│   └── jwt-verifier/         Custom Lua plugin for JWT validation
│       ├── handler.lua       Plugin logic
│       └── schema.lua        Plugin config schema
├── scripts/
│   ├── validate-config.sh    Test config syntax before deploy
│   ├── reload-config.sh      Hot reload (no downtime)
│   ├── smoke-test.sh         Verify gateway is working
│   └── setup.sh              First-time setup
├── docs/                     Architecture decisions and route docs
├── tests/                    Integration tests
├── Dockerfile                Custom Kong image with plugins baked in
├── docker-compose.yml        Standalone compose
├── .env.example              Environment template
└── README.md                 This file
```

## Quick start

### 1. Validate the config

```bash
./scripts/validate-config.sh config/kong.yml
```

### 2. Build the custom Kong image

From the project root:

```bash
docker compose -f infrastructure/docker/docker-compose.yml build api-gateway
```

### 3. Start the gateway with the rest of the platform

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### 4. Verify it's working

```bash
./scripts/smoke-test.sh
```

## Ports exposed

| Port | Purpose | Public? |
|---|---|---|
| 8080 | Proxy (HTTP) — main API entry | yes |
| 8443 | Proxy (HTTPS) | yes (prod only) |
| 8001 | Admin API | NEVER public — internal only |
| 8100 | Status / health / Prometheus metrics | internal only |

In production, only 443 (which proxies to 8443 internally) is public. The Admin API must be firewalled — anyone with access to it can reroute your traffic.

## Routes overview

All routes are versioned under `/api/v1`.

### Public routes (no JWT required)

| Method | Path | Service | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/register` | auth | Strict rate limit |
| POST | `/api/v1/auth/login` | auth | Strict rate limit |
| POST | `/api/v1/auth/refresh` | auth | |
| POST | `/api/v1/auth/forgot-password` | auth | |
| POST | `/api/v1/auth/reset-password` | auth | |
| GET | `/.well-known/jwks.json` | auth | Public keys for JWT verification |
| GET | `/api/v1/medicines` | medicine | Cached 60s |
| GET | `/api/v1/categories` | medicine | Cached 60s |
| GET | `/api/v1/search` | medicine | Cached 60s |
| GET | `/api/v1/shops` | seller | |

### Protected routes (JWT required)

| Method | Path | Service | Required role |
|---|---|---|---|
| GET | `/api/v1/auth/me` | auth | any |
| POST | `/api/v1/auth/logout` | auth | any |
| GET/POST | `/api/v1/cart` | order | customer |
| GET/POST | `/api/v1/orders` | order | customer |
| POST | `/api/v1/checkout` | order | customer |
| ANY | `/api/v1/seller/*` | seller | seller |
| ANY | `/api/v1/deliveries` | delivery | rider, customer |
| GET | `/api/v1/rider/*` | delivery | rider |
| GET | `/api/v1/reports/*` | report | admin |
| GET | `/api/v1/analytics/*` | report | admin |
| ANY | `/api/v1/admin/*` | various | admin |

## How JWT auth works

1. Client calls `POST /api/v1/auth/login` (public, no token needed)
2. Auth service issues a JWT signed with its private key, returns it to client
3. Client stores token, sends it as `Authorization: Bearer <token>` on subsequent requests
4. Gateway's `jwt-verifier` plugin:
   - Extracts the token from header
   - Fetches public keys from `http://auth-service:3001/.well-known/jwks.json` (cached)
   - Verifies signature, expiration, issuer
   - Checks role if route requires specific role
   - Forwards request to upstream with these headers:
     - `X-User-ID` — user UUID
     - `X-User-Email` — email
     - `X-User-Role` — customer / seller / rider / admin
     - `X-Request-ID` — for tracing
5. Downstream services trust these headers (only the gateway can set them — services should never accept these from external sources)

## Environment-specific deployment

### Development

```bash
KONG_DECLARATIVE_CONFIG=/etc/kong/config/kong.yml
```

### Production

Use `kong.prod.yml` which differs in:
- Stricter rate limits (5/min on login vs 10/min in dev)
- HTTPS-only (`protocols: [https]`)
- Redis-backed rate limiting (shared across replicas)
- Tighter CORS (only your real domains)
- Bot detection enabled
- Longer cache TTLs
- Stricter CSP and security headers

```bash
KONG_DECLARATIVE_CONFIG=/etc/kong/config/kong.prod.yml
```

## Common operations

```bash
# Validate config
./scripts/validate-config.sh config/kong.yml

# Hot reload after config change (zero downtime)
./scripts/reload-config.sh config/kong.yml

# View live routes
curl -s http://localhost:8001/routes | jq '.data[] | {name, paths}'

# View active services
curl -s http://localhost:8001/services | jq '.data[] | {name, host, port}'

# View Prometheus metrics
curl http://localhost:8100/metrics

# Tail gateway logs
docker compose logs -f api-gateway

# Smoke test
./scripts/smoke-test.sh
```

## Adding a new service

When you add a new microservice (say `payment-service`):

1. Add a new `services` block in `config/kong.yml`:
   ```yaml
   - name: payment-service
     url: http://payment-service:3007
     routes:
       - name: payment-protected
         paths:
           - /api/v1/payments
         methods: [GET, POST]
   ```

2. Validate: `./scripts/validate-config.sh config/kong.yml`

3. Hot reload: `./scripts/reload-config.sh config/kong.yml`

No restart needed.

## Troubleshooting

### Gateway returns 502 Bad Gateway

The upstream service is unreachable. Check:
```bash
docker compose ps
docker compose logs <service-name>
```

### Gateway returns 401 on protected route

JWT verification failed. Check:
- Token is in `Authorization: Bearer <token>` format
- Token isn't expired
- Auth service's JWKS endpoint is reachable from the gateway:
  ```bash
  docker compose exec api-gateway curl http://auth-service:3001/.well-known/jwks.json
  ```

### Rate limiting kicks in too aggressively in dev

Edit `config/kong.yml` and increase the limits, then reload.

### Config changes don't take effect

You need to reload:
```bash
./scripts/reload-config.sh config/kong.yml
```

Or restart:
```bash
docker compose restart api-gateway
```

## Security checklist for production

- [ ] Admin API (port 8001) is NOT exposed to the internet (firewall it)
- [ ] HTTPS-only (`protocols: [https]` on all routes)
- [ ] Real TLS certs (Let's Encrypt or commercial), not self-signed
- [ ] Tight CORS — only your real domains, no wildcards
- [ ] Strong rate limits using Redis (shared across replicas)
- [ ] Bot detection enabled
- [ ] Security headers verified with [securityheaders.com](https://securityheaders.com)
- [ ] Run regular `kong config parse` validation in CI
- [ ] Backup your `kong.yml` — it IS your gateway state
- [ ] Monitor with Prometheus + Grafana

## Why Kong (vs alternatives)

We chose Kong because:
- Battle-tested at scale (used by GitHub, Cisco, NASA)
- Plugin ecosystem (100+ plugins)
- Declarative config = version control friendly
- DB-less mode means no extra database to manage
- Excellent Prometheus integration
- Easy to extend with custom Lua plugins (like our `jwt-verifier`)

Alternatives considered: Traefik (great but limited custom logic), NGINX (fast but no JWT out of box), Express + http-proxy-middleware (flexible but reinventing the wheel).

## Resources

- [Kong Documentation](https://docs.konghq.com/)
- [Kong DB-less mode](https://docs.konghq.com/gateway/latest/production/deployment-topologies/db-less-and-declarative-config/)
- [Plugin development guide](https://docs.konghq.com/gateway/latest/plugin-development/)
