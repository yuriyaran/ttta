import { describe, it, expect } from "vitest";
import { setButtonContent, showStatus } from "./uiHelpers";

describe("uiHelpers", () => {
  it("should set button content with icon and text", () => {
    const button = document.createElement("button");
    const icon = '<svg>icon</svg>';
    const text = "Click me";

    setButtonContent(button, icon, text);

    expect(button.innerHTML).toBe('<svg>icon</svg><span id="btnText">Click me</span>');
  });
});
