# CalTrack System Diagrams

## Overall System Architecture

```mermaid
flowchart TD
    A[React Web App] --> B[Express API]
    B --> C[Prisma ORM]
    C --> D[(PostgreSQL)]
    B --> E[CalTrack AI Package]
    E --> F[Agents]
    E --> G[Tools]
    G --> B

    flowchart TD
    User[User Request] --> Supervisor[Supervisor Agent]
    Supervisor --> Calibration[Calibration Agent]
    Supervisor --> Documentation[Documentation Agent]
    Supervisor --> Metrology[Metrology Agent]
    Supervisor --> Planning[Planning Agent]
    Supervisor --> QA[QA Agent]
    Supervisor --> Reporting[Reporting Agent]

    Calibration --> Tools[Tool Registry]
    Documentation --> Tools
    Metrology --> Tools
    Planning --> Tools
    QA --> Tools
    Reporting --> Tools

    Tools --> Services[Application Services]
    Services --> Prisma[Prisma ORM]
    Prisma --> DB[(PostgreSQL)]



    flowchart TD
    A[Instrument Registered] --> B[Calibration Due]
    B --> C[Work Order Created]
    C --> D[Technician Performs 5-Point Calibration]
    D --> E[Calibration Record Created]
    E --> F[Submit for Review]
    F --> G{QA Review}
    G -->|Approve| H[Electronic Signature]
    G -->|Reject| I[Rework Required]
    H --> J[Immutable Approved Record]

    flowchart TD
    A[Instrument Details Page] --> B[AI Calibration Assistant]
    B --> C[Get Instrument Tool]
    B --> D[Get Calibration History Tool]
    B --> E[Search Reference Standard Tool]
    B --> F[Search Documentation Tool]

    C --> G[Instrument Data]
    D --> H[Calibration History]
    E --> I[Metrology Data]
    F --> J[Procedures and Manuals]

    G --> K[Technician Briefing]
    H --> K
    I --> K
    J --> K

    