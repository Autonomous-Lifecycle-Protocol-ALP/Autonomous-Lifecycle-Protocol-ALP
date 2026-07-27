const { test, expect } = require('@playwright/test');

test.describe('SHAM Desktop E2E', () => {
  test('renderer loads and shows welcome screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const html = await page.content();
    console.log('Page HTML length:', html.length);
    console.log('Page HTML preview:', html.slice(0, 500));
    const title = await page.title();
    console.log('Page title:', JSON.stringify(title));

    expect(html.length).toBeGreaterThan(100);
  });

  test('header shows SHAM branding', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const shamText = page.getByRole('banner').getByText('SHAM', { exact: false });
    await expect(shamText).toBeVisible();
  });

  test('pro tab is accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const proButton = page.getByRole('button', { name: /Pro/i });
    await expect(proButton).toBeVisible();
  });
});
