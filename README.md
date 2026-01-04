# Teamtailor Test Assignment

A web application that downloads candidate data with their job applications from the Teamtailor API as a CSV file.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 and click **Download CSV** button.

## Architectural Decisions

### 1. **`Node.js` + `Ruby` (with process spawning)**

Uses both Node.js and Ruby for the sake of test assignment. Each technology handles what it does best:

- **`Node.js`:** HTTP server, routing, caching, static files
- **`Ruby`:** Teamtailor API integration, data transformation, CSV generation

### 2. **Inter-Process Communication (`stdin`/`stdout`/`stderr`)**

Uses `stdin`/`stdout`/`stderr` for data exchange between Node.js and Ruby:

**Benefits:**

- **Universal interface:** Works across any language/platform
- **No file I/O:** Avoids temporary file management
- **Decoupled:** Ruby script has no dependency on Node.js internals

```typescript
// Node writes JSON to Ruby's stdin
csvProcess.stdin.write(candidatesJson);
csvProcess.stdin.end();

// Node reads CSV from Ruby's stdout
csvProcess.stdout.on("data", (data) => (csvOutput += data.toString()));
```

### 3. **Static File Serving from Same Origin**

**Benefits:**

- UI and API on same domain (localhost:3000)
- No CORS configuration needed
- Simpler deployment

```typescript
app.use(express.static(path.join(__dirname, <path>)));
```

### 4. **JSON:API Optimization with `include`, `fields`, and `page`**

Single API request fetches **candidates** AND their **applications**, with required fields only.

**Benefits:**

- `include` reduces API calls from N+1 to 1 request
- `fields` filters away noise (only required data pulled)
- `page` avoids long polling API calls

### 5. **In-Memory Caching**

**Benefits:**

- repeated downloads don't need fresh data every time
- simple, no external dependencies (Redis, etc.)
- eliminates latency/slow API response

**Trade-off:**

Data can be stale up to 5 minutes (`POST /cache/clear` resets cache)

```bash
curl -X POST http://localhost:3000/api/v1/cache/clear
```

### 6. **Multi-Layer Error Handling**

**Ruby (integration layer):**

- Validates API responses and data structure
- Exits with code 1 on errors, logs details to stderr
- Includes error context (backtrace, input preview)

**Node.js (orchestration layer):**

- Catches Ruby process errors via exit codes
- Returns HTTP 500 with error details for debugging
- Logs all errors (stderr + exceptions) to console

**Frontend (UI layer):**

- Displays user-friendly error messages
- Shows API error details when available

### 7. **Encrypted Environment Variables with `dotenvx`**

**Benefits:**

- encrypts sensitive API keys
- commits safely encrypted `.env` to git
- is decrypted at runtime

### 8. **Minimal UI**

- No build step for CSS (modern browsers support CSS nesting)
- Single-page, single-purpose interface
- Fast, no framework overhead

### 9. **Code Maintenance**

Implemented tools:

- Prettier
- Rubocop

## Available Endpoints

### `POST /api/v1/export-csv`

Generates and downloads a CSV file with candidate data.

**Response:**

- Content-Type: `text/csv`
- Filename: `candidates-<yyyy-mm-dd>.csv`

**CSV Columns:**

- `candidate_id` - Candidate ID
- `first_name` - Candidate's first name
- `last_name` - Candidate's last name
- `email` - Candidate's email address
- `job_application_id` - Application ID (`null` if no applications)
- `job_application_created_at` - Application creation timestamp (`null` if no applications)

### `POST /api/v1/cache/clear`

Clears the candidate data cache.

### `GET /health`

Health check endpoint.

## Folder Structure

```
.
├── node/                        # Node.js + Express server
│   ├── node/downloadCsv.test.ts # Downloads CSV test
│   ├── node/downloadCsv.ts      # Downloads CSV from the API endpoint
│   ├── index.ts                 # Express server
│   ├── index.html               # Frontend UI
│   └── index.css                # Styling
├── ruby/                        # Ruby scripts for data processing
│   ├── bin/
│   │   ├── export_csv.rb        # Converts JSON to CSV
│   │   └── fetch_candidates.rb  # Fetches data from Teamtailor API
│   ├── lib/
│   │   ├── csv_generator.rb     # CSV generation logic
│   │   └── teamtailor_client.rb # API client with JSON:API support
│   └── spec/                    # RSpec tests
├── .env                         # Encrypted API key (dotenvx)
└── package.json                 # Node.js dependencies
```

## Technology Stack

**Backend:**

- Node.js v20+ with Express 5
- Ruby v4.0

**Frontend:**

- Vanilla ~~JavaScript~~ TypeScript (no frameworks)
- Native CSS (no CSS pre-processors)

**API Client:**

- `HTTParty` (Ruby)
- `JSON:API` protocol

**Security:**

- `dotenvx` for secrets management

## Testing

```bash
# Ruby tests
pnpm test:ruby

# Node tests
pnpm test:node
```

## Scripts

- `pnpm dev` - Start development server with auto-reload
- `pnpm test` - Run all tests (for `ruby` and `node`)
- `pnpm build` - Build TypeScript
- `pnpm start` - Run production build
