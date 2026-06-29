# CalTrack Production Deployment & Operations Guide

This guide details the procedures for configuring, building, deploying, and maintaining the CalTrack enterprise calibration tracking platform in production environments.

---

## 1. System Requirements & Architecture

CalTrack is designed as a modular monorepo:
*   **Frontend**: React client compiled with Vite, served statically via Nginx.
*   **Backend**: Express REST API running on Node.js.
*   **Database**: PostgreSQL (v15+) managed via Prisma ORM.

### Production Ports Configuration
*   `80`: Nginx Web Server (serves React files and reverse-proxies `/api` to the backend)
*   `3001`: Express REST API Server
*   `5433` (external) / `5432` (internal): PostgreSQL Database Engine

---

## 2. Environment Variables Specification

The system checks and validates environment configurations during server boot. Missing or default configs in production mode will trigger a boot failure.

### Backend (`apps/api/.env`)
| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Environment level (`development`, `production`) | Yes | `development` |
| `PORT` | Local server port for Express listener | No | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | None |
| `JWT_SECRET` | Secret key used for signing session JWT tokens | Yes | None |
| `FRONTEND_URL` | Target origin URL to allow CORS access | No | `http://localhost:5173` |

### Frontend (`apps/web/.env`)
| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | REST API target url (optional in docker-proxying) | No | `http://localhost:3001` |

---

## 3. Docker Production Deployment

Docker configurations utilize multi-stage builds to compile assets and generate optimized, lightweight, production runtime images.

### Quick Start with Docker Compose
To build and start the entire production container cluster (Web, API, and Postgres DB):

```bash
# Start the production containers in detached daemon mode
docker compose -f docker-compose.prod.yml up --build -d

# Verify running container status
docker compose -f docker-compose.prod.yml ps
```

### Manual Database Migrations inside Container
After spinning up the production containers, perform migrations and seed the enterprise users table:

```bash
# Push schema migrations
docker compose -f docker-compose.prod.yml exec api npx prisma db push

# Seed industrial instrumentation and user accounts
docker compose -f docker-compose.prod.yml exec api npm run db:seed
```

---

## 4. Manual / Bare-Metal Production Deployment

If deploying without Docker, build and run the services directly on a Linux/Unix server:

```bash
# 1. Install all monorepo dependencies
npm ci

# 2. Synchronize database schema and generate Prisma client
npm run prisma:generate
npx prisma db push --schema=apps/api/prisma/schema.prisma

# 3. Seed initial plant parameters and users
npm run db:seed --workspace=@caltrack/api

# 4. Build all workspaces (Types, Utils, AI, Backend, and Frontend)
npm run build

# 5. Start the backend process using a manager like PM2
pm2 start apps/api/dist/index.js --name "caltrack-api"
```

---

## 5. Operations & Troubleshooting

### Viewing Server Logs
CalTrack uses structured JSON logging in production for ingestion by log monitors (Datadog, Kibana, etc.).

```bash
# Check backend server logs
docker compose -f docker-compose.prod.yml logs api -f

# Check web server logs
docker compose -f docker-compose.prod.yml logs web -f
```

### Diagnosing Database Failures
If the backend fails to connect to the database, query the `/health` endpoint:

```bash
curl http://localhost/health
```

**Expected Healthy Response (`200 OK`):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 120.45,
  "database": "connected"
}
```

**Unhealthy Response (`500 Internal Server Error`):**
```json
{
  "status": "unhealthy",
  "version": "1.0.0",
  "uptime": 120.45,
  "database": "disconnected"
}
```

---

## 6. Pre-Flight Deployment Checklist

- [ ] **Secret Management**: Generate a cryptographically strong `JWT_SECRET` and set it in your hosting platform's environment settings.
- [ ] **HTTPS Certificates**: Configure SSL/TLS termination on Nginx or cloud load balancer.
- [ ] **Database Backups**: Set up automated daily snapshot replication for the PostgreSQL database volume.
- [ ] **Resource Limits**: Restrict CPU and memory parameters in your container orchestration dashboard to avoid performance starvation.
- [ ] **NIST Calibration Schedules**: Ensure the database timezone matches UTC to maintain accurate audit trail timelines.
