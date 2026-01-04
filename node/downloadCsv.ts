/**
 * Downloads CSV from the API endpoint
 * @param apiUrl - Base API URL
 * @param onStatusChange - Callback for status updates (message, type)
 * @returns CSV blob
 */
export async function downloadCsv(
  apiUrl: string,
  onStatusChange: (message: string, type: string) => void = () => {}
): Promise<Blob> {
  onStatusChange("Generating CSV...", "info");

  const response = await fetch(`${apiUrl}/api/v1/export-csv`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorDetails =
      errorData.details || errorData.error || `Server returned ${response.status}`;
    throw new Error(errorDetails);
  }

  const blob = await response.blob();
  onStatusChange("CSV downloaded successfully!", "success");
  return blob;
}

/**
 * Triggers browser download of a blob
 * @param blob - The blob to download
 * @param filename - The filename for the download
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
