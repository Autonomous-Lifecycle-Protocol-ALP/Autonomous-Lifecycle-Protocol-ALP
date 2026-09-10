import { test, expect } from "@playwright/test";

test("homepage loads with expected title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/ALP/);
  await expect(page.getByRole("heading", { name: /ALP/i })).toBeVisible();
});

test("navigation contains Testing link", async ({ page }) => {
  await page.goto("/");
  const testingLink = page.getByRole("link", { name: /Testing/i });
  await expect(testingLink).toBeVisible();
});
