# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: example.spec.ts >> navigation contains Testing link
- Location: tests\example.spec.ts:9:1

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
  3  | test("homepage loads with expected title", async ({ page }) => {
  4  |   await page.goto("/");
  5  |   await expect(page).toHaveTitle(/ALP/);
  6  |   await expect(page.getByRole("heading", { name: /ALP/i })).toBeVisible();
  7  | });
  8  | 
  9  | test("navigation contains Testing link", async ({ page }) => {
> 10 |   await page.goto("/");
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5174/
  11 |   const testingLink = page.getByRole("link", { name: /Testing/i });
  12 |   await expect(testingLink).toBeVisible();
  13 | });
  14 | 
```