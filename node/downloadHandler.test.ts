import { describe, it, expect, vi } from "vitest";
import { DownloadHandler } from "./downloadHandler";

describe("DownloadHandler", () => {
  it("should initialize with provided API URL, button, and status element", () => {
    const apiUrl = "http://localhost:3000";
    const button = document.createElement("button");
    const statusEl = document.createElement("div");

    const handler = new DownloadHandler(apiUrl, button, statusEl);

    expect(handler).toBeInstanceOf(DownloadHandler);
  });
});
