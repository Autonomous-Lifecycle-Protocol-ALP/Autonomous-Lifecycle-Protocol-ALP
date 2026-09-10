import { test, expect } from '@playwright/test';

test.describe('App E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with brand visible', async ({ page }) => {
    await expect(page.locator('.brand-logo')).toHaveText('ALP');
    await expect(page.locator('.brand-title')).toHaveText('Execution Engine & DAG Playground');
  });

  test('editor renders', async ({ page }) => {
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('graph renders', async ({ page }) => {
    await expect(page.locator('.graph-container .react-flow')).toBeVisible();
  });

  test('template loads', async ({ page }) => {
    await page.selectOption('.template-select', 'swarm');
    await expect(page.locator('.toast-banner span')).toHaveText(/Loaded "Swarm & Multi-Agent Network"/);
  });

  test('snippet inserts', async ({ page }) => {
    await page.locator('.snippet-chip').filter({ hasText: '+ @task' }).click();
    await expect(page.locator('.toast-banner span')).toHaveText('Inserted @task');
  });

  test('export buttons trigger download toast', async ({ page }) => {
    await page.locator('.action-btn').filter({ hasText: 'JSON' }).click();
    await expect(page.locator('.toast-banner span')).toHaveText(/Downloaded spec\.json/, { timeout: 10000 });
  });

  test('keyboard shortcut triggers PNG export', async ({ page }) => {
    await page.locator('.action-btn').filter({ hasText: 'PNG' }).click();
    await expect(page.locator('.toast-banner span')).toHaveText(/Downloaded spec\.png/, { timeout: 10000 });
  });

  test('modal opens and closes', async ({ page }) => {
    await page.locator('.action-btn').filter({ hasText: 'Add' }).click();
    await expect(page.locator('#add-block-title')).toContainText('Create New ALP Primitive');
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('theme toggle changes theme', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('.theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('simulation starts', async ({ page }) => {
    await page.getByRole('button', { name: 'Run Swarm Sim' }).click();
    await expect(page.getByRole('button', { name: 'Pause Sim' })).toBeVisible();
  });
});
