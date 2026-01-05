import { describe, it, expect, beforeEach } from "vitest";

describe("client", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="downloadBtn"></button>
      <div id="status"></div>
    `;
  });

  it("should have DOM elements available for initialization", () => {
    const downloadBtn = document.getElementById("downloadBtn");
    const statusEl = document.getElementById("status");

    expect(downloadBtn).toBeInstanceOf(HTMLButtonElement);
    expect(statusEl).toBeInstanceOf(HTMLElement);
  });
});
