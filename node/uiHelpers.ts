/**
 * UI helper functions for manipulating the DOM and displaying status messages
 */

export type StatusType = "info" | "success" | "error";

/**
 * Sets the button content with an icon and text
 * 
 * @param button - The button element to update
 * @param icon - SVG icon markup string
 * @param text - Button text to display
 */
export function setButtonContent(button: HTMLButtonElement, icon: string, text: string): void {
  button.innerHTML = icon + `<span id="btnText">${text}</span>`;
}

/**
 * Displays a status message with appropriate styling
 * 
 * @param statusElement - The status element to update
 * @param message - Message text to display
 * @param type - Message type ('info', 'success', 'error')
 */
export function showStatus(statusElement: HTMLElement, message: string, type: StatusType = "info"): void {
  statusElement.textContent = message;
  statusElement.className = `status ${type} show`;
}
