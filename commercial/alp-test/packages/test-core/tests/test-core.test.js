import { describe, it, expect, vi } from "vitest";
import { chromium } from "../src/index.js";

describe("@alp/test-core", () => {
  it("exports playwright chromium", () => {
    expect(chromium).toBeDefined();
    expect(typeof chromium.launch).toBe("function");
  });
});
