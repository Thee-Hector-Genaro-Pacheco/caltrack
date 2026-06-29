---
theme: seriph
title: CalTrack Enterprise Architecture
class: text-center
drawings:
  persist: false
transition: fade
mdc: true
---

# CalTrack

## Enterprise Architecture

Industrial Calibration Management Platform  
**Instrumentation • Metrology • Compliance • AI Assistance**

<div class="pt-10 text-xl opacity-80">
React • Express • PostgreSQL • Prisma • TypeScript
</div>

---

# The Problem

Industrial calibration is often managed with:

- Paper records
- Excel spreadsheets
- Disconnected procedures
- Manual audit tracking
- Poor equipment traceability

<div class="pt-8 text-2xl">
This creates compliance risk and operational blind spots.
</div>

---

# CalTrack Solution

CalTrack centralizes:

- Instrument registry
- Calibration records
- Work orders
- Reference standards
- Documentation
- Audit trail
- AI technician briefings

---

# Enterprise Architecture Overview

<div class="flex justify-center items-center h-full">
  <img
    src="./public/images/Enterprise-architecture-overview-of-CalTrack.png"
    style="max-height: 95%; max-width:100%; object-fit:contain;"
  />
</div>

---

# High-Level System Architecture

```mermaid
flowchart LR
    A[React Web App] --> B[Express REST API]
    B --> C[Application Services]
    C --> D[Prisma ORM]
    D --> E[(PostgreSQL)]
    B --> F[CalTrack AI Package]
    F --> G[Agents]
    F --> H[Tools]
    H --> C