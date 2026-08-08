import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
  test('logs in with seeded credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await page.fill('input[type="email"]', 'demo@alp-enterprise.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('shows error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await expect(page.locator('.bg-red-900\\/40')).toBeVisible();
  });

  test('can register a new account', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await page.click('text=Need an account? Register');
    await page.waitForTimeout(500);

    await page.fill('input[type="text"]', 'Test User');
    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'testpass123');
    await page.fill('input[placeholder="Organization Name"]', 'Test Org');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});
