import { describe, it, expect } from "vitest";
import { generateTestsFromPrompt, healSelector } from "../src/index.js";

describe("@alp/test-ai", () => {
  it("generates test steps from a prompt and context", async () => {
    const result = await generateTestsFromPrompt("Verify checkout button", {
      url: "https://example.com/checkout",
      assertions: [{ target: "#checkout-btn", expectation: "toBeVisible()" }],
    });

    expect(result.prompt).toBe("Verify checkout button");
    expect(result.generated).toHaveLength(1);
    expect(result.generated[0].steps).toContain("goto('https://example.com/checkout')");
    expect(result.generated[0].steps).toContain("expect(#checkout-btn).toBeVisible()");
  });

  it("handles empty context gracefully", async () => {
    const result = await generateTestsFromPrompt("Basic test");
    expect(result.prompt).toBe("Basic test");
    expect(result.generated[0].steps).toContain("Navigate to the target page");
  });

  it("attempts selector healing strategies and throws on unresolvable selector", async () => {
    const mockPage = {
      locator: () => ({ count: async () => 0 }),
      getByText: () => ({ count: async () => 0 }),
      getByLabel: () => ({ count: async () => 0 }),
      getByPlaceholder: () => ({ count: async () => 0 }),
    };

    await expect(healSelector(mockPage, "non-existent-element")).rejects.toThrow(
      "Unable to heal selector"
    );
  });

  it("successfully resolves selector when strategy finds elements", async () => {
    const mockLocator = { first: () => "healed-element" };
    const mockPage = {
      locator: (s) => ({
        count: async () => (s.includes("login-btn") ? 1 : 0),
        first: () => mockLocator.first(),
      }),
      getByText: () => ({ count: async () => 0 }),
      getByLabel: () => ({ count: async () => 0 }),
      getByPlaceholder: () => ({ count: async () => 0 }),
    };

    const result = await healSelector(mockPage, "login-btn");
    expect(result).toBe("healed-element");
  });
});
