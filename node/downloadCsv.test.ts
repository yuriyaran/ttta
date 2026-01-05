import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadCsv } from "./downloadCsv";

describe("downloadCsv", () => {
  const API_URL = "http://localhost:3000";
  let mockFetch: ReturnType<typeof vi.fn>;
  let statusChanges: Array<{ message: string; type: string }>;

  beforeEach(() => {
    // Reset status changes tracking
    statusChanges = [];

    // Mock global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  describe("successful download", () => {
    it("should fetch CSV data successfully", async () => {
      const csvData = "candidate_id,first_name,last_name\n1,John,Doe";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          csv: csvData,
          meta: {},
          links: {},
          recordCount: 1,
        }),
      });

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

  describe("failed download", () => {
    it("should throw error when response is not ok with error details", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: "Failed to export CSV",
          details: "Ruby process exited with code 1",
        }),
      });

      await expect(downloadCsv(API_URL, null, () => {})).rejects.toThrow(
        "Ruby process exited with code 1",
      );
    });

    it("should throw error with generic error message when details not available", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: "Failed to export CSV",
        }),
      });

      await expect(downloadCsv(API_URL, null, () => {})).rejects.toThrow(
        "Failed to export CSV",
      );
    });

    it("should NOT succeed when response.ok is false even with 200-like blob", async () => {
      const mockBlob = new Blob(["candidate_id,first_name\n1,John"], {
        type: "text/csv",
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal error" }),
        blob: async () => mockBlob,
      });

      await expect(downloadCsv(API_URL, null, () => {})).rejects.toThrow("Internal error");
    });

    it("should NOT treat empty error object as success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(downloadCsv(API_URL, null, () => {})).rejects.toThrow("Server returned 500");
    });
  });
});
