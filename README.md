# Teamtailor Test Assignment

A web application that downloads candidate data with their job applications from the Teamtailor API as a CSV file.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 and click "Download CSV"

## Folder Structure

```
.
├── node/              # Node.js + Express server
│   ├── index.ts      # Express server with API endpoint
│   ├── index.html    # Frontend UI
│   └── index.css     # Styling
├── ruby/             # Ruby scripts for data processing
│   ├── bin/
│   │   ├── fetch_candidates.rb  # Fetches data from Teamtailor API
│   │   └── export_csv.rb        # Converts JSON to CSV
│   ├── lib/
│   │   ├── teamtailor_client.rb # API client with JSON:API support
│   │   └── csv_generator.rb     # CSV generation logic
│   └── spec/         # RSpec tests
├── .env              # Encrypted API key (dotenvx)
└── package.json      # Node.js dependencies
```

## Available Endpoints

### `POST /api/v1/export-csv`

Generates and downloads a CSV file with candidate data.

**Response:**

- Content-Type: `text/csv`
- Filename: `candidates.csv`

**CSV Columns:**

- `candidate_id` - Teamtailor candidate ID
- `first_name` - Candidate's first name
- `last_name` - Candidate's last name
- `email` - Candidate's email address
- `job_application_id` - Application ID (null if no applications)
- `job_application_created_at` - Application creation timestamp

### `GET /health`

Health check endpoint.

### `POST /api/v1/cache/clear`

Clears the candidate data cache.

## Architecture Decisions

### 1. **Node.js + Ruby Hybrid Approach**

**Why:** Leverages strengths of both languages:

- **Node.js/Express:** Web server, API endpoints, static file serving
- **Ruby:** API client, CSV generation (Ruby's CSV library is robust)

**How:** Node.js spawns Ruby processes, pipes data via stdin/stdout

### 2. **JSON:API Optimization with `include`**

**Why:** Single API request fetches candidates AND their applications

```ruby
query: { include: 'job-applications', page: { size: 30 } }
```

**Benefit:** Reduces API calls from N+1 to 1 request

### 3. **In-Memory Caching (5 minutes TTL)**

**Why:**

- Teamtailor API can be slow for large datasets
- Repeated downloads don't need fresh data every time
- Simple, no external dependencies (Redis, etc.)

**Trade-off:** Data can be stale up to 5 minutes

### 4. **Streaming Architecture (stdin/stdout)**

**Why:**

- Handles large datasets without loading everything in memory
- Ruby script reads JSON from stdin, writes CSV to stdout
- Node.js streams data directly to HTTP response

**Code:**

```typescript
csvProcess.stdin.write(candidatesJson);
csvProcess.stdout.on("data", (data) => (csvOutput += data));
```

### 5. **Encrypted Environment Variables (dotenvx)**

**Why:**

- API keys are sensitive
- Can commit encrypted `.env` to git safely
- Decrypted at runtime

### 6. **Static File Serving from Same Origin**

**Why:**

- UI and API on same domain (localhost:3000)
- No CORS configuration needed
- Simpler deployment

```typescript
app.use(express.static(path.join(__dirname, ".")));
```

### 7. **Minimal UI with Native CSS Nesting**

**Why:**

- No build step for CSS (modern browsers support nesting)
- Single-page, single-purpose interface
- Fast, no framework overhead

### 8. **Error Handling at Process Level**

**Why:** Ruby scripts exit with proper codes (0 = success, 1 = error)

```ruby
exit 1 if error
```

Node.js catches errors and returns HTTP 500

## Technology Stack

**Backend:**

- Node.js 20+ with Express 5
- TypeScript
- Ruby 4.0

**Frontend:**

- Vanilla JavaScript
- Native CSS nesting
- No framework

**API Client:**

- HTTParty (Ruby)
- JSON:API protocol

**Security:**

- dotenvx for secrets management

## Testing

```bash
# Ruby tests
cd ruby
rspec

# Node tests (if implemented)
pnpm test
```

## Scripts

- `pnpm dev` - Start development server with auto-reload
- `pnpm build` - Build TypeScript
- `pnpm start` - Run production build
- `pnpm test` - Run tests
