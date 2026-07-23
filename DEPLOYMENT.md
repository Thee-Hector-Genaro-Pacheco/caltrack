# CalTrack Complete Production Deployment & Operations Guide

This guide documents the architecture, configuration, build, deployment, database migration, seeding, health checking, and troubleshooting procedures for the CalTrack enterprise platform.

---

## 1. System Architecture Overview

CalTrack uses a multi-tier production architecture:

*   **Frontend**: React + TypeScript client compiled with Vite, deployed to **Vercel** (`https://caltrack-web-six.vercel.app`).
*   **Vercel Serverless Proxy**: Root catch-all proxy function (`api/[...path].ts`) that forwards relative browser API calls (`/api/*`) to the backend via HTTPS.
*   **Backend API**: Express REST API on Node.js/TypeScript, containerized with Docker and hosted on **AWS ECS Fargate** (`http://3.18.108.1:3001`).
*   **Database Engine**: PostgreSQL on **Amazon RDS** managed via Prisma ORM.

```
[ Browser / Client ]
        │ (HTTPS relative /api/* requests)
        ▼
[ Vercel Serverless Proxy: api/[...path].ts ]
        │ (Forwards HTTP requests)
        ▼
[ AWS ECS Fargate Express API: http://3.18.108.1:3001 ]
        │ (Prisma ORM)
        ▼
[ Amazon RDS PostgreSQL Database ]
```

---

## 2. Environment Variables Reference

### Vercel Function / Serverless Proxy Environment
| Variable | Description | Location | Security / Visibility |
| :--- | :--- | :--- | :--- |
| `CALTRACK_API_ORIGIN` | Target HTTP origin of the ECS API container (e.g. `http://3.18.108.1:3001`) | Vercel Environment Settings | **Server-Only** (Do NOT prefix with `VITE_`) |

### Backend API (`apps/api/.env`)
| Variable | Description | Required | Example / Default |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment mode | Yes | `production` |
| `PORT` | HTTP listener port for Express | No | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@rds-endpoint:5432/caltrack?schema=public` |
| `JWT_SECRET` | Secret key for signing and verifying JWT session tokens | Yes | Strong high-entropy secret string |
| `FRONTEND_URL` | Frontend origin for CORS verification | No | `https://caltrack-web-six.vercel.app` |

### Frontend Build (`apps/web/.env`)
| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `VITE_ENABLE_MOCK_API` | Development mock API fallback toggle | No | `false` (Disabled in production builds) |

---

## 3. Database Schema Migrations & Idempotent Seeding

> [!CAUTION]
> **Destructive Database Commands Are Strictly Forbidden in Production**:
> Never run `prisma migrate reset`, `DROP TABLE`, or `db push --force-reset` against production database instances.

### Safe Production Schema Migration
Execute schema migrations using non-destructive deployment commands:

```bash
# Apply pending Prisma migrations
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

### Idempotent Enterprise User & Plant Seeding
Seeding uses `prisma.user.upsert` to guarantee that multiple deployments or container restarts will never create duplicate user records or overwrite existing active users.

```bash
# Seed initial plant hierarchy and user accounts
node apps/api/dist/prisma/seed.js
# Or via workspace script:
npm run db:seed --workspace=@caltrack/api
```

#### Enterprise Accounts & Roles Configured
| Email | Password | Role | System Permissions |
| :--- | :--- | :--- | :--- |
| `demo@caltrack.com` | `DemoOnly123!` | `DEMO_VIEWER` | Read-only public portfolio access (Mutations blocked with 403 Forbidden) |
| `admin@caltrack.com` | `Password123!` | `ADMINISTRATOR` | Full system registry, user management, & NIST standards access |
| `supervisor@caltrack.com` | `Password123!` | `SUPERVISOR` | Work order scheduling & instrument management |
| `qa@caltrack.com` | `Password123!` | `QA_REVIEWER` | Calibration record review, approval, & rejection |
| `technician@caltrack.com` | `Password123!` | `TECHNICIAN` | Field calibration submission & work order execution |
| `manager@caltrack.com` | `Password123!` | `METROLOGY_MANAGER` | NIST reference standard & documentation management |

---

## 4. AWS ECS Fargate Backend Deployment

### 1. Build and Push API Container Image to ECR
```bash
# 1. Login to Amazon ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# 2. Build Docker container image for API
docker build -t caltrack-api:latest -f apps/api/Dockerfile .

# 3. Tag and push image to ECR
docker tag caltrack-api:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/caltrack-api:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/caltrack-api:latest
```

### 2. Update ECS Task Definition & Service
```bash
# Register updated task definition revision
aws ecs register-task-definition --cli-input-json file://scripts/aws/task-definition.json --region us-east-1

# Trigger rolling redeploy of ECS service
aws ecs update-service --cluster caltrack-prod-cluster --service caltrack-api-service --force-new-deployment --region us-east-1

# Wait for service stability
aws ecs wait services-stable --cluster caltrack-prod-cluster --services caltrack-api-service --region us-east-1
```

### 3. AWS Security Group Requirement
Because Vercel Serverless Functions execute on dynamic cloud IP ranges, the ECS Fargate Security Group inbound rules must allow **TCP port 3001 from `0.0.0.0/0`**.

---

## 5. Vercel Frontend Deployment

### 1. SPA Rewrites & Proxy Config
- `vercel.json`:
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "rewrites": [
      {
        "source": "/((?!api/).*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
- Catch-All Proxy: `api/[...path].ts` handles all `/api/*` traffic and maps:
  - `/api/health` → `${CALTRACK_API_ORIGIN}/health`
  - `/api/auth/login` → `${CALTRACK_API_ORIGIN}/api/auth/login`
  - `/api/*` → `${CALTRACK_API_ORIGIN}/api/*`

### 2. Deploying to Vercel
```bash
# Trigger production deployment via Vercel CLI
vercel --prod
```

---

## 6. Repeatable Deployment Pipeline

After setup, future deployments require only standard source pushes and automated triggers:

1. **Git Push**: Push changes to main release branch.
2. **ECS Deployment**: Trigger container update on AWS ECS Fargate.
3. **Vercel Deployment**: Trigger frontend build on Vercel.

No manual fixes, file edits, or secret re-configurations are required.

---

## 7. Health Checks & Verification

### 1. Health Check Endpoint
Query the public Vercel health endpoint to verify API and database connectivity:

```bash
curl -i https://caltrack-web-six.vercel.app/api/health
```

**Expected Healthy Response (`200 OK`)**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 1420.5,
  "database": "connected"
}
```

### 2. Public Demo Authentication Check
```bash
curl -i -X POST https://caltrack-web-six.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  --data '{"email":"demo@caltrack.com","password":"DemoOnly123!"}'
```

---

## 8. Rollback Procedures

### 1. ECS Backend Rollback
To roll back the Express backend to a previous task definition:

```bash
# Update service to use previous task definition revision (e.g. revision 4)
aws ecs update-service --cluster caltrack-prod-cluster --service caltrack-api-service --task-definition caltrack-api:4 --region us-east-1
```

### 2. Vercel Frontend Rollback
Use Vercel Dashboard -> **Deployments** -> select previous deployment -> click **Promote to Production** for instant 1-click rollback.

---

## 9. Operations & Troubleshooting

### Viewing Production Logs
- **CloudWatch Logs**: All Express API logs, full stack traces, and unhandled errors are logged in JSON format to AWS CloudWatch Log Group `/ecs/caltrack-api`.
- **Browser Logs**: Frontend error messages are sanitized in production mode. Internal database schemas, Prisma stack traces, and raw SQL queries are masked with clean user-facing error messages.

### Common Error Resolutions
*   **401 Unauthorized**: Session token expired or invalid. The frontend automatically clears `localStorage` auth keys (`caltrack_token`, `caltrack_user`) and redirects cleanly to `/login`.
*   **403 Forbidden (DEMO_VIEWER)**: Triggered when a `DEMO_VIEWER` account attempts a database mutation (`POST`, `PUT`, `PATCH`, `DELETE`). This is expected security behavior.
*   **502 Upstream Unavailable**: Vercel Proxy cannot connect to ECS container. Verify ECS task health status and confirm AWS Security Group TCP port 3001 inbound rules allow traffic.
