# CalTrack System Diagrams

## Enterprise Architecture Overview

![CalTrack Enterprise Architecture](./assets/caltrack-enterprise-architecture.png)

---

# Overall System Architecture

```mermaid
flowchart TD

    A[React Web Application]
    B[Express REST API]
    C[CalTrack AI Package]
    D[Prisma ORM]
    E[(PostgreSQL)]

    A --> B
    B --> C
    B --> D
    D --> E
```

---

# AI Multi-Agent Architecture

```mermaid
flowchart TD

    User[User Request]

    Supervisor[Supervisor Agent]

    Calibration[Calibration Agent]
    Documentation[Documentation Agent]
    Metrology[Metrology Agent]
    Planning[Planning Agent]
    QA[QA Agent]
    Reporting[Reporting Agent]

    ToolRegistry[Tool Registry]

    Services[Application Services]

    Prisma[Prisma ORM]

    Database[(PostgreSQL)]

    User --> Supervisor

    Supervisor --> Calibration
    Supervisor --> Documentation
    Supervisor --> Metrology
    Supervisor --> Planning
    Supervisor --> QA
    Supervisor --> Reporting

    Calibration --> ToolRegistry
    Documentation --> ToolRegistry
    Metrology --> ToolRegistry
    Planning --> ToolRegistry
    QA --> ToolRegistry
    Reporting --> ToolRegistry

    ToolRegistry --> Services
    Services --> Prisma
    Prisma --> Database
```

---

# Calibration Workflow

```mermaid
flowchart TD

    A[Instrument Registered]
    B[Calibration Due]
    C[Work Order Created]
    D[Technician Performs Calibration]
    E[Calibration Record]
    F[Submit For Review]
    G{QA Review}
    H[Approved]
    I[Rejected]
    J[Electronic Signature]
    K[Permanent Audit Record]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G

    G -->|Approve| H
    G -->|Reject| I

    H --> J
    J --> K
```

---

# AI Calibration Assistant Workflow

```mermaid
flowchart TD

    Instrument[Instrument Details Page]

    Assistant[AI Calibration Assistant]

    InstrumentTool[Get Instrument Tool]
    HistoryTool[Get Calibration History Tool]
    StandardTool[Search Reference Standard Tool]
    DocumentationTool[Search Documentation Tool]

    InstrumentData[Instrument Data]
    HistoryData[Calibration History]
    StandardData[Reference Standards]
    DocumentationData[Technical Documentation]

    Briefing[Technician Briefing]

    Instrument --> Assistant

    Assistant --> InstrumentTool
    Assistant --> HistoryTool
    Assistant --> StandardTool
    Assistant --> DocumentationTool

    InstrumentTool --> InstrumentData
    HistoryTool --> HistoryData
    StandardTool --> StandardData
    DocumentationTool --> DocumentationData

    InstrumentData --> Briefing
    HistoryData --> Briefing
    StandardData --> Briefing
    DocumentationData --> Briefing
```