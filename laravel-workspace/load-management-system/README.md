# Microfinance Loan Management System

A full-stack application with **Laravel 11 REST API** + **Next.js 15 frontend** using dual-database architecture (**PostgreSQL** for auth, **MySQL** for loans).

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌────────────┐
│  Next.js 15  │────▶│  Laravel 11 API  │────▶│ PostgreSQL │  Users & Auth
│  Port 3000   │     │    Port 8000     │     │  Port 5432 │
└──────────────┘     └──────────────────┘     └────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │     MySQL      │  Loans & Repayments
                     │   Port 3306   │
                     └────────────────┘
```

## Quick Start

```bash
# Clone and start all services
docker compose up --build

# Wait ~60 seconds for first build, then:
# Frontend: http://localhost:3000
# API:      http://localhost:8000
```

## Services

| Service    | Port | Description                              |
|------------|------|------------------------------------------|
| frontend   | 3000 | Next.js 15 (React 19 + Tailwind CSS 4)   |
| backend    | 8000 | Laravel 11 REST API (Sanctum auth)        |
| postgres   | 5432 | PostgreSQL 16 — users & authentication    |
| mysql      | 3306 | MySQL 8.0 — loans & repayment schedules   |

## API Endpoints

| Method | Endpoint                    | Auth     | Description              |
|--------|-----------------------------|----------|--------------------------|
| POST   | `/api/register`             | Public   | Register a borrower      |
| POST   | `/api/login`                | Public   | Login & get token        |
| POST   | `/api/logout`               | Bearer   | Revoke token             |
| POST   | `/api/loans/apply`          | Bearer   | Apply for a loan         |
| GET    | `/api/loans`                | Bearer   | List borrower's loans    |
| GET    | `/api/loans/{id}/repayments`| Bearer   | View repayment schedule  |

## Dual-Database Configuration

**PostgreSQL** (`pgsql` connection):
- `users` table — borrower profiles & credentials
- `personal_access_tokens` — Sanctum tokens

**MySQL** (`mysql` connection):
- `loans` table — loan applications (auto-approved)
- `repayments` table — monthly installment schedules

Configured in `backend/config/database.php` with separate connection credentials.

## Business Logic

- Loan applications are **automatically approved** on submission
- Repayment schedules are generated with **10% total interest**
- Formula: `total_repayable = loan_amount × 1.10`
- Equal monthly installments over the loan term
- Interest and principal are distributed evenly per installment

## Frontend Pages

1. **Registration** (`/register`) — Create borrower account
2. **Login** (`/login`) — Authenticate with email/password
3. **Dashboard** (`/dashboard`) — View all applied loans
4. **Loan Application** (`/loans`) — Submit new loan request
5. **Repayment Schedule** (`/loans/{id}`) — View installment breakdown

## Development

```bash
# Rebuild a specific service
docker compose up --build backend

# View logs
docker compose logs -f backend

# Access Laravel CLI
docker compose exec backend php artisan tinker

# Run migrations manually
docker compose exec backend php artisan migrate --database=pgsql
docker compose exec backend php artisan migrate --database=mysql

# Stop everything
docker compose down

# Stop and remove volumes (reset databases)
docker compose down -v
```

## Environment Variables

Backend vars are in `docker-compose.yml` → `backend.environment`.
Frontend uses `NEXT_PUBLIC_API_URL` to point to the Laravel API.
