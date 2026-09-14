# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: alp-test.smoke.spec.ts >> ALP Test smoke suite >> feature chips render in featured card
- Location: tests\alp-test.smoke.spec.ts:36:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/
Call log:
  - navigating to "http://localhost:5174/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("ALP Test smoke suite", () => {
  4  |   test("homepage renders testing section", async ({ page }) => {
  5  |     await page.goto("/");
  6  |     await expect(page.locator("#testing")).toBeVisible();
  7  |     await expect(page.getByText("ALP Test")).toBeVisible();
  8  |   });
  9  | 
  10 |   test("testing cards are visible", async ({ page }) => {
  11 |     await page.goto("/");
  12 |     await expect(page.getByText("E2E Testing")).toBeVisible();
  13 |     await expect(page.getByText("Visual Regression")).toBeVisible();
  14 |     await expect(page.getByText("AI Test Generation")).toBeVisible();
  15 |   });
  16 | 
  17 |   test("featured ALP Test card exists with CTAs", async ({ page }) => {
  18 |     await page.goto("/");
  19 |     await expect(page.getByText("ALP Test is now in beta")).toBeVisible();
  20 |     await expect(page.getByText("View Product Details")).toBeVisible();
  21 |     await expect(page.getByText("Get Started")).toBeVisible();
  22 |   });
  23 | 
  24 |   test("product showcase links to ALP Test detail page", async ({ page }) => {
  25 |     await page.goto("/");
  26 |     const alpTestCard = page.getByText("ALP Test").first();
  27 |     await expect(alpTestCard).toBeVisible();
  28 |   });
  29 | 
  30 |   test("navigation includes Testing link", async ({ page }) => {
  31 |     await page.goto("/");
  32 |     const testingLink = page.getByRole("link", { name: /Testing/i });
  33 |     await expect(testingLink).toBeVisible();
  34 |   });
  35 | 
  36 |   test("feature chips render in featured card", async ({ page }) => {
> 37 |     await page.goto("/");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/
  38 |     await expect(page.getByText("Playwright-class E2E")).toBeVisible();
  39 |     await expect(page.getByText("Visual regression diff")).toBeVisible();
  40 |     await expect(page.getByText("AI test generation")).toBeVisible();
  41 |     await expect(page.getByText("Self-healing selectors")).toBeVisible();
  42 |   });
  43 | });
  44 | 
```