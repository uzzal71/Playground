# Medicine E-commerce — Docker setup

Three Compose files. Combine them depending on what you need.

```
infrastructure/docker/
├── docker-compose.yml             # base — all 7 services + databases + RabbitMQ + Redis + Elasticsearch
├── docker-compose.prod.yml        # production overrides — secrets, replicas, limits, hidden ports
└── docker-compose.monitoring.yml  # observability — Prometheus, Grafana, Loki, Promtail, Jaeger
```

## Local development

```bash
# Start the platform
docker compose -f infrastructure/docker/docker-compose.yml up -d

# Add monitoring on top
docker compose \
  -f infrastructure/docker/docker-compose.yml \
  -f infrastructure/docker/docker-compose.monitoring.yml \
  up -d

# Tail logs of one service
docker compose -f infrastructure/docker/docker-compose.yml logs -f order-service

# Rebuild after code change
docker compose -f infrastructure/docker/docker-compose.yml up -d --build order-service

# Stop everything
docker compose -f infrastructure/docker/docker-compose.yml down

# Stop + delete all data (nukes volumes)
docker compose -f infrastructure/docker/docker-compose.yml down -v
```

## Production deployment

```bash
# 1. Copy and fill in real secrets
cp .env.production.example .env.production
# Edit .env.production — replace every CHANGE_ME with a strong password

# 2. Deploy
docker compose \
  -f infrastructure/docker/docker-compose.yml \
  -f infrastructure/docker/docker-compose.prod.yml \
  --env-file .env.production \
  up -d

# 3. Verify
docker compose -f infrastructure/docker/docker-compose.yml ps
```

## URLs

| Service | URL | Notes |
|---|---|---|
| API Gateway | http://localhost:8080 | the only public service |
| RabbitMQ UI | http://localhost:15672 | admin / admin |
| Grafana | http://localhost:3000 | admin / admin (change on first login) |
| Prometheus | http://localhost:9090 | metrics queries |
| Jaeger | http://localhost:16686 | distributed traces |

In production all infrastructure ports are removed — only port 443 (gateway) is reachable from outside.

## Monitoring stack — what each piece does

| Component | Purpose |
|---|---|
| Prometheus | Scrapes `/metrics` from each service every 15s, stores time-series data |
| Grafana | UI for metrics, logs, and traces — single pane of glass |
| Loki | Log database (think Prometheus for logs) |
| Promtail | Tails Docker container logs and ships them to Loki |
| Jaeger | Stores distributed traces — follow one request across services |
| Node Exporter | Host-level metrics (CPU, memory, disk) |
| cAdvisor | Per-container metrics |

## What your services need to expose

For monitoring to work, each service must:

1. Expose `GET /metrics` returning Prometheus format (use `prom-client` for Node, `micrometer` for Java, `prometheus_client` for Python).
2. Log in JSON format to stdout with at least `level`, `timestamp`, `message`, `request_id`, `trace_id` fields. Promtail will capture this automatically.
3. Send OpenTelemetry traces to `http://jaeger:4318/v1/traces` (OTLP HTTP).
4. Expose `GET /health` and `GET /ready` for healthchecks.

## Event flow (from RabbitMQ definitions.json)

```
order.events  ──► seller.order.created      (Seller service reserves stock)
              ──► delivery.order.created    (Delivery service finds rider)
              ──► report.all.events         (Report service logs everything)

delivery.events ──► order.delivery.assigned (Order service updates status)
                ──► report.all.events

[any service].events ──► report.all.events  (Report consumes all)
```

Failed messages route to a dead-letter queue (`dlq`) for later inspection.

## Common operations

```bash
# Connect to a service's DB
docker compose -f infrastructure/docker/docker-compose.yml exec postgres-order \
  psql -U order_user -d order_db

# Connect to RabbitMQ CLI
docker compose -f infrastructure/docker/docker-compose.yml exec rabbitmq rabbitmqctl status

# Reload Prometheus config without restart
curl -X POST http://localhost:9090/-/reload

# Check what's running
docker compose -f infrastructure/docker/docker-compose.yml ps
```
