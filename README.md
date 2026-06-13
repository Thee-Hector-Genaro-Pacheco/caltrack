# CalTrack - Calibration & Instrumentation Management System

CalTrack is a modern, enterprise-grade industrial calibration and instrumentation registry platform. Designed for industrial facilities and calibration laboratories, CalTrack manages instruments, calibration logs, and generates immutable audit trails to comply with standards like ISO 9001 and FDA 21 CFR Part 11.

---

## Technical Architecture

This project is organized as a monorepo using **NPM Workspaces**:

```text
caltrack/
├── apps/
│   ├── web/          # React, Vite, TailwindCSS (v3), React Router, Supabase Client
│   └── api/          # Node.js, Express, TypeScript, Prisma Client, Postgresql
├── packages/
│   ├── types/        # Shared domain TypeScript types and DTOs
│   └── utils/        # Shared utility functions (e.g. difference engine)
├── docker-compose.yml# Local PostgreSQL container configuration
└── package.json      # Monorepo workspaces definition and orchestration scripts
```

---

## Tech Stack Summary

- **Frontend**: React, Vite, TailwindCSS, Lucide Icons, Recharts (compliance statistics)
- **Backend**: Node.js, Express, Prisma ORM, Zod Validation
- **Database**: PostgreSQL (Prisma adapter)
- **Authentication**: Supabase Auth (token parsing & validation)

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- Docker Desktop (for running the local database)

### Installation

1. Clone the repository and navigate into the root directory:
   ```bash
   cd caltrack
   ```

2. Install all monorepo dependencies (packages are automatically linked by NPM Workspaces):
   ```bash
   npm install
   ```

---

## Database Configuration

1. **Spin up local PostgreSQL**:
   Make sure Docker is running, then start the container:
   ```bash
   docker compose up -d
   ```

2. **Configure Environments**:
   Copy `.env.example` to `.env` in the backend workspace:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   *(If you are not using Supabase auth right away, the API will automatically default to a robust mock developer session so you can read and write data immediately without errors).*

3. **Run Prisma Migrations**:
   Run the Prisma DB sync command to create the schema models inside PostgreSQL:
   ```bash
   npm run prisma:migrate
   ```

---

## Running the Applications

To launch both the React Vite client and the Express API server concurrently:

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health

---

## Core MVP Features & Routes

### 1. Authentication
- Client handles login and registration using the Supabase Auth SDK.
- The backend verifies bearer tokens in the authorization header and registers technician credentials in the audit service.

### 2. Instrument Registry
- **CRUD Endpoints**: `/api/instruments`
- **Fields**: tagNumber, instrumentType, manufacturer, model, rangeMin, rangeMax, engineeringUnits, signalType, location, status.

### 3. Calibration Records
- **Endpoint**: `/api/calibrations` (POST)
- **Cascade status logic**: Creating a calibration record automatically shifts the corresponding instrument's status to `ACTIVE` (on pass) or `CALIBRATION_DUE` (on fail).

### 4. Audit Trail
- **Endpoint**: `/api/audit` (GET)
- **Automated Diff Logging**: Every Create, Update, and Delete action automatically saves an entry with the exact changed parameters (`oldValue` vs `newValue`) and the required justification `reason`.
