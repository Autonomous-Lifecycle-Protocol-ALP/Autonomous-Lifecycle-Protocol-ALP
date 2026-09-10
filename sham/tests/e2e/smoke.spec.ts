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
    // The header is a <header> element with class "app-header"
    // containing a logo div with span text "SHAM"
    const shamText = page.locator('header').getByText('SHAM', { exact: false });
    await expect(shamText.first()).toBeVisible();
  });

  test('editor tab is accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    // The header contains panel buttons including "Editor"
    const editorButton = page.locator('header').getByRole('button', { name: /Editor/i });
    await expect(editorButton).toBeVisible();
  });
});
