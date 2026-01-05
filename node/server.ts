import express, { Request, Response, NextFunction } from "express";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import * as path from "path";
import { fileURLToPath } from "url";
import "@dotenvx/dotenvx/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execFileAsync = promisify(execFile);
const app = express();
const PORT = 3000;

// Body parser middleware
app.use(express.json());
app.use("/dist", express.static("dist"));
const RUBY_BIN = path.join(__dirname, "../ruby/bin");

/**
 * Fetches candidates data from Teamtailor API via Ruby script
 *
 * @param pageAfter - Pagination cursor for fetching records after this cursor
 * @returns Promise resolving to JSON string with candidates data
 */
async function fetchCandidatesData(pageAfter: string = ''): Promise<string> {
  console.log(`Fetching candidates data from Teamtailor: ${pageAfter}`);
  const { stdout, stderr } = await execFileAsync(
    "ruby",
    [path.join(RUBY_BIN, "fetch_candidates.rb")],
    {
      env: {
        ...process.env,
        API_KEY: process.env.API_KEY,
        PAGE_AFTER: pageAfter,
      },
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  if (stderr) {
    console.error("[fetch_candidates stderr]:", stderr);
  }

  return stdout;
}

// Serve static files (index.html, index.css)
// so the UI and API are on the same origin (no CORS needed)
app.use(
  express.static(
    path.join(
      __dirname,
      __filename.includes("dist/index.js") ? "../node" : ".",
    ),
  ),
);

// Routes
app.post("/api/v1/export-csv", async (req: Request, res: Response) => {
  try {
    const { url } = req.body || {};

    // Extract pagination cursor from URL if provided
    let pageAfter = '';
    if (url) {
      const urlObj = new URL(url);
      pageAfter = urlObj.searchParams.get('page[after]') || '';
    }

    // Fetch candidates
    const candidatesJson = await fetchCandidatesData(pageAfter);

    // Then convert to CSV using spawn to pipe stdin
    const csvProcess = spawn("ruby", [path.join(RUBY_BIN, "export_csv.rb")]);

    let csvOutput = "";
    let csvError = "";

    csvProcess.stdout.on("data", (data) => {
      csvOutput += data.toString();
    });

    csvProcess.stderr.on("data", (data) => {
      const stderrText = data.toString();
      csvError += stderrText;
      console.error("[export_csv stderr]:", stderrText);
    });

    await new Promise((resolve, reject) => {
      csvProcess.on("close", (code) => {
        if (code === 0) {
          resolve(null);
        } else {
          reject(
            new Error(`Ruby process exited with code ${code}: ${csvError}`),
          );
        }
      });

      // Write candidates JSON to stdin
      csvProcess.stdin.write(candidatesJson);
      csvProcess.stdin.end();
    });

    const parsed = JSON.parse(candidatesJson);

    res.json({
      csv: csvOutput,
      meta: parsed.meta || {},
      links: parsed.links || {},
      recordCount: parsed.data?.length || 0
    });
  } catch (error) {
    console.error("Error exporting CSV:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to export CSV",
      details: errorMessage,
    });
  }
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Handle 404
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).send("Oops! Can't find the resource.");
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
