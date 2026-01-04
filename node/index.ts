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

const RUBY_BIN = path.join(__dirname, "../ruby/bin");

// Simple in-memory cache
interface CacheEntry {
  data: string;
  timestamp: number;
}

let candidatesCache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

function isCacheValid(): boolean {
  if (!candidatesCache) return false;
  return Date.now() - candidatesCache.timestamp < CACHE_TTL;
}

async function fetchCandidatesData(): Promise<string> {
  if (isCacheValid() && candidatesCache) {
    console.log("Returning cached candidates data");
    return candidatesCache.data;
  }

  console.log("Fetching fresh candidates data from Teamtailor");
  const { stdout, stderr } = await execFileAsync(
    "ruby",
    [path.join(RUBY_BIN, "fetch_candidates.rb")],
    {
      env: { ...process.env, API_KEY: process.env.API_KEY },
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  if (stderr) {
    console.error("[fetch_candidates stderr]:", stderr);
  }

  candidatesCache = {
    data: stdout,
    timestamp: Date.now(),
  };

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
    // Fetch candidates (uses cache if available)
    const candidatesJson = await fetchCandidatesData();

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

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=candidates.csv");
    res.send(csvOutput);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      error: "Failed to export CSV",
      details: errorMessage
    });
  }
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Clear cache
app.post("/api/v1/cache/clear", (req: Request, res: Response) => {
  candidatesCache = null;
  console.log("Cache cleared");
  res.json({ message: "Cache cleared successfully" });
});

// Handle 404
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).send("Oops! Can't find the resource.");
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
