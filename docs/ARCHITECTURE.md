# Architecture Mindmap

Critical components and data flow:

```mermaid
graph TB
    subgraph "Browser Client"
        HTML[index.html<br/>UI Shell]
        CLIENT[client.ts<br/>Entry Point]
        HANDLER[DownloadHandler<br/>State & Flow Manager]
        DLCSV[downloadCsv<br/>API Communication]
        UI[uiHelpers<br/>DOM Manipulation]
        ICONS[icons.ts<br/>SVG Assets]

        HTML --> CLIENT
        CLIENT --> HANDLER
        HANDLER --> DLCSV
        HANDLER --> UI
        CLIENT --> UI
        CLIENT --> ICONS
        HANDLER --> ICONS
    end

    subgraph "Node.js Server"
        SERVER[server.ts<br/>Express API :3000]
        ENDPOINT[POST /api/v1/export-csv<br/>Main Endpoint]

        SERVER --> ENDPOINT
    end

    subgraph "Ruby Layer"
        FETCH_SCRIPT[fetch_candidates.rb<br/>Script Entry]
        EXPORT_SCRIPT[export_csv.rb<br/>Script Entry]
        TT_CLIENT[TeamtailorClient<br/>HTTP Wrapper]
        CSV_GEN[CsvGenerator<br/>CSV Builder]

        FETCH_SCRIPT --> TT_CLIENT
        EXPORT_SCRIPT --> CSV_GEN
    end

    subgraph "External"
        TT_API[Teamtailor API<br/>api.teamtailor.com]
    end

    DLCSV -->|HTTP POST| ENDPOINT
    ENDPOINT -->|execFile| FETCH_SCRIPT
    TT_CLIENT -->|HTTPS| TT_API
    TT_API -->|JSON Response| TT_CLIENT
    TT_CLIENT -->|stdout JSON| ENDPOINT
    ENDPOINT -->|spawn + stdin| EXPORT_SCRIPT
    CSV_GEN -->|stdout CSV| ENDPOINT
    ENDPOINT -->|JSON Response| DLCSV
    HANDLER -->|Pagination State| HANDLER
    HANDLER -->|Trigger Download| HTML

    style CLIENT fill:#e1f5ff
    style SERVER fill:#fff4e1
    style FETCH_SCRIPT fill:#ffe1e1
    style EXPORT_SCRIPT fill:#ffe1e1
    style TT_API fill:#e1ffe1
    style HANDLER fill:#e1f5ff,stroke:#0066cc,stroke-width:3px
    style ENDPOINT fill:#fff4e1,stroke:#cc6600,stroke-width:3px
```

## **Core Data Flow**
1. **Browser** → User clicks download button
2. **Client.ts** → DownloadHandler makes API call
3. **Server.ts** → Express receives request, orchestrates Ruby scripts
4. **Ruby Scripts** → Fetch from Teamtailor API → Convert to CSV
5. **Server** → Returns CSV + pagination metadata
6. **Browser** → Downloads file, updates UI for next batch

---

## ** Frontend (Browser)**
- **client.ts** - Initializes app on DOM ready
- **DownloadHandler** - Core state machine handling:
  - Button clicks
  - Pagination state (tracks downloaded records)
  - UI transitions (download → next batch → refresh)
- **downloadCsv.ts** - Thin API wrapper (fetch + blob creation)
- **uiHelpers.ts** - DOM utilities (status messages, button content)
- **icons.ts** - SVG definitions (download, reload)

---

## ** Backend (Node.js Express)**
- **server.ts** - Single endpoint architecture
  - `POST /api/v1/export-csv` - Main workflow orchestrator
  - Extracts pagination cursor from URL
  - Spawns Ruby processes:
    1. `fetch_candidates.rb` (via execFile)
    2. `export_csv.rb` (via spawn + stdin pipe)
  - Returns `{csv, meta, links, recordCount}`
  - Serves static files (no CORS needed)

---

## ** Ruby Layer**
- **fetch_candidates.rb** - CLI script wrapper
  - Reads `API_KEY` + `PAGE_AFTER` from env
  - Outputs JSON to stdout
- **TeamtailorClient** - HTTParty wrapper
  - Fetches candidates with job applications
  - Handles API versioning, pagination
- **export_csv.rb** - CLI script wrapper
  - Reads JSON from stdin
  - Outputs CSV to stdout
- **CsvGenerator** - Business logic
  - Parses JSON:API format
  - Denormalizes candidates × job applications
  - Handles missing data gracefully

---

## ** Key Patterns**
- **Process Isolation** - Node spawns Ruby for each API operation
- **Streaming** - CSV generation uses stdin/stdout pipes
- **Pagination** - Client tracks `links.next` URL, server stateless
- **Progressive Download** - Downloads one batch at a time, accumulates count
- **Error Boundaries** - Each layer has try/catch with specific error messages

---

## ** Tech Stack**
- **Frontend**: TypeScript, Vanilla JS (no framework), Vite build
- **Backend**: Express 5, Node 20+
- **Scripts**: Ruby 3.x, HTTParty, CSV stdlib
- **Testing**: Vitest (Node), RSpec (Ruby)

---

## ** External Dependencies**
- **Teamtailor API** - Source of candidates data
  - Auth: Bearer token
  - Format: JSON:API with includes
  - Pagination: Cursor-based (`page[after]`)