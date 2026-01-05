import { describe, it, expect, vi } from "vitest";
import { downloadCsv } from "./downloadCsv";

describe("downloadCsv", () => {
  it("should fetch CSV data successfully", async () => {
    const API_URL = "http://localhost:3000";
    const csvData = "candidate_id,first_name,last_name\n1,John,Doe";
    const statusChanges: Array<{ message: string; type: string }> = [];

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        csv: csvData,
        meta: {},
        links: {},
        recordCount: 1,
      }),
    });
    global.fetch = mockFetch;

    const onStatusChange = (message: string, type: string) => {
      statusChanges.push({ message, type });
    };

    const result = await downloadCsv(API_URL, null, onStatusChange);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/export-csv",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: null }),
      },
    );
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.meta).toEqual({});
    expect(result.recordCount).toBe(1);
    expect(statusChanges).toEqual([
      { message: "Generating CSV...", type: "info" },
      { message: "CSV downloaded successfully!", type: "success" },
    ]);
  });
});
