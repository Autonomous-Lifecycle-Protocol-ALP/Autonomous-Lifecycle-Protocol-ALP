import { test, expect } from "@playwright/test";

test.describe("ALP Test smoke suite", () => {
  test("homepage renders testing section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#testing")).toBeVisible();
    await expect(page.getByText("ALP Test")).toBeVisible();
  });

  test("testing cards are visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("E2E Testing")).toBeVisible();
    await expect(page.getByText("Visual Regression")).toBeVisible();
    await expect(page.getByText("AI Test Generation")).toBeVisible();
  });

  test("featured ALP Test card exists with CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("ALP Test is now in beta")).toBeVisible();
    await expect(page.getByText("View Product Details")).toBeVisible();
    await expect(page.getByText("Get Started")).toBeVisible();
  });

  test("product showcase links to ALP Test detail page", async ({ page }) => {
    await page.goto("/");
    const alpTestCard = page.getByText("ALP Test").first();
    await expect(alpTestCard).toBeVisible();
  });

  test("navigation includes Testing link", async ({ page }) => {
    await page.goto("/");
    const testingLink = page.getByRole("link", { name: /Testing/i });
    await expect(testingLink).toBeVisible();
  });

  test("feature chips render in featured card", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Playwright-class E2E")).toBeVisible();
    await expect(page.getByText("Visual regression diff")).toBeVisible();
    await expect(page.getByText("AI test generation")).toBeVisible();
    await expect(page.getByText("Self-healing selectors")).toBeVisible();
  });
});
