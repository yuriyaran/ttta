export interface CsvLinks {
  next?: string;
  prev?: string;
}

/**
 * Downloads CSV from the API endpoint
 *
 * @param apiUrl - Base API URL
 * @param pageUrl - Optional pagination URL (for next page)
 * @param onStatusChange - Callback for status updates (message, type)
 * @returns Promise resolving to CSV response with blob and metadata
 */
export async function downloadCsv(
  apiUrl: string,
  pageUrl: string | null = null,
  onStatusChange: (message: string, type: string) => void = () => {}
): Promise<{ blob: Blob; meta: any; links: any; recordCount: number }> {
  onStatusChange("Generating CSV...", "info");

  const response = await fetch(`${apiUrl}/api/v1/export-csv`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: pageUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorDetails =
      errorData.details ||
      errorData.error ||
      `Server returned ${response.status}`;
    throw new Error(errorDetails);
  }

  const data = await response.json();
  const blob = new Blob([data.csv], { type: "text/csv" });

  onStatusChange("CSV downloaded successfully!", "success");
  return {
    blob,
    meta: data.meta,
    links: data.links,
    recordCount: data.recordCount,
  };
}

/**
 * Triggers browser download of a blob
 *
 * @param blob - The blob to download
 * @param filename - The filename for the download
 * @returns void
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
