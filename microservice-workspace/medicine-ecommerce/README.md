cat > README.md << 'EOF'

# Medicine E-commerce Platform

A microservice-based medicine e-commerce platform built with event-driven architecture.

## Architecture

7 microservices behind an API gateway, communicating via REST (sync) and RabbitMQ (async events):

- **api-gateway** — single public entry point
- **auth-service** — users, JWT, roles
- **medicine-service** — product catalog with search
- **seller-service** — shops and inventory
- **order-service** — cart, checkout, order state
- **delivery-service** — rider dispatch and tracking
- **report-service** — analytics consumer

## Quick start

```bash
# Start the full stack
docker compose -f infrastructure/docker/docker-compose.yml up -d

# With monitoring
docker compose \
  -f infrastructure/docker/docker-compose.yml \
  -f infrastructure/docker/docker-compose.monitoring.yml \
  up -d
```

See `infrastructure/docker/README.md` for full operational guide.

## Folder structure
