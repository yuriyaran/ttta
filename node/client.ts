import { DownloadHandler } from "./downloadHandler.js";
import { setButtonContent } from "./uiHelpers.js";
import { downloadIcon } from "./icons.js";

/**
 * Application configuration
 */
const API_URL: string = "http://localhost:3000";

/**
 * Initializes the application
 */
function initializeApp(): void {
  const downloadBtn = document.getElementById("downloadBtn");
  const statusEl = document.getElementById("status");

  if (!downloadBtn || !(downloadBtn instanceof HTMLButtonElement)) {
    console.error("Download button not found");
    return;
  }

  if (!statusEl) {
    console.error("Status element not found");
    return;
  }

  // Initialize button with download icon
  setButtonContent(downloadBtn, downloadIcon, 'Download CSV');

  // Create and initialize download handler
  const downloadHandler = new DownloadHandler(API_URL, downloadBtn, statusEl);
  downloadHandler.initialize();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
