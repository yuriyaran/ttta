import { downloadCsv, triggerDownload } from "./downloadCsv.js";
import type { CsvLinks } from "./downloadCsv.js";
import { setButtonContent, showStatus } from "./uiHelpers.js";
import type { StatusType } from "./uiHelpers.js";
import { reloadIcon } from "./icons.js";

/**
 * Manages the download process and pagination state
 */
export class DownloadHandler {
  private apiUrl: string;
  private downloadButton: HTMLButtonElement;
  private statusElement: HTMLElement;
  private downloadedRecordCount: number = 0;
  private currentPageUrl: string | null = null;
  private boundHandleDownload?: () => void;

  constructor(apiUrl: string, downloadButton: HTMLButtonElement, statusElement: HTMLElement) {
    this.apiUrl = apiUrl;
    this.downloadButton = downloadButton;
    this.statusElement = statusElement;
  }

  /**
   * Wrapper for showStatus that uses the instance's status element
   */
  private showStatus(message: string, type: StatusType = "info"): void {
    showStatus(this.statusElement, message, type);
  }

  /**
   * Handles the download button click event
   */
  private async handleDownload(): Promise<void> {
    this.downloadButton.disabled = true;

    try {
      const { blob, meta, links, recordCount } = await downloadCsv(
        this.apiUrl,
        this.currentPageUrl,
        (message, type) => this.showStatus(message, type as StatusType)
      );

      const filename = `candidates-${new Date().toISOString().split("T")[0]}.csv`;
      triggerDownload(blob, filename);

      // Show metadata if available
      if (meta && meta['record-count']) {
        this.downloadedRecordCount += recordCount;
        this.showStatus(
          `Downloaded ${this.downloadedRecordCount} candidates out of ${meta['record-count']}.`,
          'success'
        );
      }

      // Update button for next batch or convert to refresh button
      this.updateButtonForNextAction(links);
    } catch (error) {
      console.error('Download failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.showStatus('Failed to download CSV: ' + errorMessage, 'error');
    } finally {
      this.downloadButton.disabled = false;
    }
  }

  /**
   * Updates the button based on whether there's a next page or not
   * 
   * @param links - Links object containing pagination URLs
   */
  private updateButtonForNextAction(links: CsvLinks): void {
    if (links && links.next) {
      // More data available - update for next batch
      this.currentPageUrl = links.next;
      const btnText = document.getElementById('btnText');
      if (btnText) {
        btnText.textContent = 'Download CSV (Next Batch)';
      }
    } else {
      // No more data - convert to refresh button
      setButtonContent(this.downloadButton, reloadIcon, 'Page Refresh');
      if (this.boundHandleDownload) {
        this.downloadButton.removeEventListener('click', this.boundHandleDownload);
      }
      this.downloadButton.addEventListener('click', () => window.location.reload());
    }
  }

  /**
   * Initializes the download handler by binding the event listener
   */
  public initialize(): void {
    // Store bound function so we can remove it later if needed
    this.boundHandleDownload = () => void this.handleDownload();
    this.downloadButton.addEventListener('click', this.boundHandleDownload);
  }
}
