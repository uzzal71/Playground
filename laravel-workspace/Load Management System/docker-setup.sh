#!/bin/bash
# ============================================================
#  Microfinance Docker Setup Script
#  Run from: ~/Desktop/Laravel Workspace/Load Management System/
# ============================================================

set -e

echo "============================================"
echo "  Microfinance — Docker Setup"
echo "============================================"

# ─── Step 1: Build & Start all containers ─────────────
echo ""
echo "[1/4] Building and starting all containers..."
docker compose up -d --build

echo ""
echo "[2/4] Waiting for databases to be ready..."
sleep 10

# ─── Step 2: Generate app key if needed ───────────────
echo ""
echo "[3/4] Running Laravel setup..."
docker compose exec backend php artisan key:generate --force 2>/dev/null || true
docker compose exec backend php artisan jwt:secret --force 2>/dev/null || true

# ─── Step 3: Run migrations ──────────────────────────
echo ""
echo "[4/4] Running database migrations..."
docker compose exec backend php artisan migrate --database=pgsql --path=database/migrations/pgsql --force
docker compose exec backend php artisan migrate --database=mysql --path=database/migrations/mysql --force

# ─── Step 4: Generate Swagger docs ───────────────────
docker compose exec backend php artisan l5-swagger:generate 2>/dev/null || true

echo ""
echo "============================================"
echo "  All services are running!"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  Swagger:   http://localhost:8000/api/documentation"
echo "  PostgreSQL: localhost:5432 (microfinance_auth)"
echo "  MySQL:      localhost:3306 (microfinance_loans)"
echo ""
echo "  Commands:"
echo "    docker compose logs -f         → View all logs"
echo "    docker compose down            → Stop everything"
echo "    docker compose up -d --build   → Rebuild"
echo "============================================"
