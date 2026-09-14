const { test, expect } = require('@playwright/test');

test.describe('Swarm Topology Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
  });

  test('grid view is default in marketplace panel', async ({ page }) => {
    await page.locator('.sidebar-drawer-launcher-btn').click();
    await page.waitForSelector('div[role="dialog"][aria-label="Panels and Tools Drawer"]', { timeout: 10000 });

    const dialog = page.locator('div[role="dialog"][aria-label="Panels and Tools Drawer"]');
    await expect(dialog).toBeVisible();

    // Search for Marketplace (matches both Marketplace and Model Hub; Marketplace is last)
    const searchInput = page.locator('.panels-drawer-search-input');
    await searchInput.fill('Marketplace');
    await page.waitForTimeout(300);

    // Click the Marketplace card (last match since Model Hub appears before Marketplace in ALL_PANELS)
    const card = dialog.locator('.panels-drawer-card', { hasText: 'Marketplace' }).last();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForSelector('.swarm-topology-view-toggle', { timeout: 10000 });

    // Drawer should close
    await expect(dialog).not.toBeVisible();

    // Grid view should be active (default) - topology should NOT be visible
    await expect(page.locator('[data-testid="swarm-topology"]')).not.toBeVisible();

    // Grid view toggle should be active
    const gridBtn = page.locator('.swarm-topology-view-toggle button').first();
    await expect(gridBtn).toHaveClass(/active/);
  });

  test('toggle to topology view renders SwarmTopology', async ({ page }) => {
    // Open marketplace via drawer
    await page.locator('.sidebar-drawer-launcher-btn').click();
    await page.waitForSelector('div[role="dialog"][aria-label="Panels and Tools Drawer"]', { timeout: 10000 });

    const dialog = page.locator('div[role="dialog"][aria-label="Panels and Tools Drawer"]');
    await expect(dialog).toBeVisible();

    // Search for Swarm (only matches Marketplace, not Model Hub)
    const searchInput = page.locator('.panels-drawer-search-input');
    await searchInput.fill('Swarm');
    await page.waitForTimeout(300);

    const card = dialog.locator('.panels-drawer-card', { hasText: 'Marketplace' }).last();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForSelector('.swarm-topology-view-toggle', { timeout: 10000 });
    await expect(dialog).not.toBeVisible();

    // Click Topology Graph toggle
    const topologyBtn = page.locator('.swarm-topology-view-toggle button').nth(1);
    await expect(topologyBtn).toHaveText(/Topology Graph/i);
    await topologyBtn.click();
    await page.waitForSelector('[data-testid="swarm-topology"]', { timeout: 10000 });

    // Topology should now be visible
    await expect(page.locator('[data-testid="swarm-topology"]')).toBeVisible();

    // Topology toggle should be active
    await expect(topologyBtn).toHaveClass(/active/);

    // Grid toggle should NOT be active
    const gridBtn = page.locator('.swarm-topology-view-toggle button').first();
    await expect(gridBtn).not.toHaveClass(/active/);
  });

  test('topology view shows swarm nodes and can toggle back to grid', async ({ page }) => {
    // Open marketplace
    await page.locator('.sidebar-drawer-launcher-btn').click();
    await page.waitForSelector('div[role="dialog"][aria-label="Panels and Tools Drawer"]', { timeout: 10000 });

    const dialog = page.locator('div[role="dialog"][aria-label="Panels and Tools Drawer"]');
    await expect(dialog).toBeVisible();

    // Search for Swarm (only matches Marketplace, not Model Hub)
    const searchInput = page.locator('.panels-drawer-search-input');
    await searchInput.fill('Swarm');
    await page.waitForTimeout(300);

    const card = dialog.locator('.panels-drawer-card', { hasText: 'Marketplace' }).last();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForSelector('.swarm-topology-view-toggle', { timeout: 10000 });
    await expect(dialog).not.toBeVisible();

    // Switch to topology view
    await page.locator('.swarm-topology-view-toggle button').nth(1).click();
    await page.waitForSelector('[data-testid="swarm-topology"]', { timeout: 10000 });

    // Verify topology nodes are rendered
    await expect(page.locator('[data-testid="swarm-node-coordinator"]')).toBeVisible();
    await expect(page.locator('[data-testid="swarm-node-hello"]')).toBeVisible();
    await expect(page.locator('[data-testid="swarm-node-analyst"]')).toBeVisible();
    await expect(page.locator('[data-testid="swarm-node-sentinel"]')).toBeVisible();
    await expect(page.locator('[data-testid="swarm-node-refactor"]')).toBeVisible();

    // Switch back to grid view
    await page.locator('.swarm-topology-view-toggle button').first().click();
    await page.waitForSelector('[data-testid="swarm-topology"]', { state: 'detached', timeout: 10000 });

    // Grid button should be active again
    await expect(page.locator('.swarm-topology-view-toggle button').first()).toHaveClass(/active/);
  });

  test('toggle buttons have correct initial state', async ({ page }) => {
    // Open marketplace
    await page.locator('.sidebar-drawer-launcher-btn').click();
    await page.waitForSelector('div[role="dialog"][aria-label="Panels and Tools Drawer"]', { timeout: 10000 });

    const dialog = page.locator('div[role="dialog"][aria-label="Panels and Tools Drawer"]');
    await expect(dialog).toBeVisible();

    // Search for Swarm (only matches Marketplace, not Model Hub)
    const searchInput = page.locator('.panels-drawer-search-input');
    await searchInput.fill('Swarm');
    await page.waitForTimeout(300);

    const card = dialog.locator('.panels-drawer-card', { hasText: 'Marketplace' }).last();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForSelector('.swarm-topology-view-toggle', { timeout: 10000 });
    await expect(dialog).not.toBeVisible();

    // Verify toggle buttons exist and Grid is active by default
    const toggleContainer = page.locator('.swarm-topology-view-toggle');
    await expect(toggleContainer).toBeVisible();

    const gridBtn = toggleContainer.locator('button').first();
    const topologyBtn = toggleContainer.locator('button').nth(1);

    await expect(gridBtn).toHaveText(/Grid View/i);
    await expect(topologyBtn).toHaveText(/Topology Graph/i);
    await expect(gridBtn).toHaveClass(/active/);
    await expect(topologyBtn).not.toHaveClass(/active/);
  });
});
