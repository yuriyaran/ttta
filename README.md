# Teamtailor Test Assignment

A basic (framework-less) web application that downloads candidates' data with their job applications from the Teamtailor API in a CSV file format.

## Requirements

- connect to the Teamtailor API and fetch all candidates and their job applications
- convert the response into a CSV with columns: `candidate_id`, `first_name`, `last_name`, `email`, `job_application_id`, and `job_application_created_at`
- let the user download the file by clicking a button

## Implementation Details

- HTML page with button that triggers CSV file download
- API pagination implemented as a consecutive user-triggered process. Each button click prepares CSV with next batch of data until all records are saved. Page reload resets the pagination.

### Demo

<video controls width="800">
  <source src="assets/demo.webm" type="video/webm">
  Your browser does not support the video tag.
</video>

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 and click **Download CSV** button.

## Architectural Decisions

### 1. **`Node.js` + `Ruby` (with process spawning)**

Uses both Node.js and Ruby for the sake of test assignment. Each technology handles what it does best:

- **`Node.js`:** HTTP server, webpage
- **`Ruby`:** Teamtailor API integration, data transformation, CSV generation

Rather a debatable solution for production code. It was more of an experiment to try something new outside conventional frameworks approach.

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

### 5. **Multi-Layer Error Handling**

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

### 6. **Encrypted Environment Variables with `dotenvx`**

**Benefits:**

- encrypts sensitive API keys
- commits safely encrypted `.env` to git
- is decrypted at runtime

### 7. **Minimal UI**

- No build step for CSS (no pre-processors)
- Single-page, single-purpose interface
- Simple, no framework overhead

### 8. **Code Maintenance**

Implemented tools:

- Prettier
- Rubocop
- TSDoc
- `concurrently` (helps maintaining live-reload in development mode)

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

### `GET /health`

Health check endpoint.

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
