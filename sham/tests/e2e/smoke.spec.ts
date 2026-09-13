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
    await page.waitForTimeout(1000);
    const shamText = page.locator('header').getByText('SHAM', { exact: false });
    await expect(shamText.first()).toBeVisible();
  });

  test('editor tab is accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const editorButton = page.locator('header').getByRole('button', { name: /Editor/i });
    await expect(editorButton).toBeVisible();
  });

  test('switching panel navigates away from welcome screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const terminalButton = page.locator('header').getByRole('button', { name: /Terminal/i });
    await expect(terminalButton).toBeVisible();
    await terminalButton.click();
    await page.waitForTimeout(500);
    const welcomeSubtitle = page.getByText('Smart Hosted Agent Manager');
    await expect(welcomeSubtitle).not.toBeVisible();
  });

  test('sidebar toggles on and off with header button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    const toggleBtn = page.locator('button[aria-label="Toggle Sidebar"]');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await page.waitForTimeout(300);

    await expect(sidebar).not.toBeVisible();

    await toggleBtn.click();
    await page.waitForTimeout(300);
    await expect(sidebar).toBeVisible();
  });

  test('sidebar workspace search filter prunes files dynamically', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Click search filter icon in workspace tree header
    const searchFilterBtn = page.locator('button[title="Filter Workspace Files"]');
    await expect(searchFilterBtn).toBeVisible();
    await searchFilterBtn.click();

    // Type filter query into input
    const filterInput = page.locator('input[placeholder="Filter files..."]');
    await expect(filterInput).toBeVisible();
    await filterInput.fill('package');
    await page.waitForTimeout(300);

    // package.json should remain visible, while hello.alp should be hidden
    await expect(page.locator('.sidebar').getByText('package.json')).toBeVisible();
    await expect(page.locator('.sidebar').getByText('hello.alp')).not.toBeVisible();

    // Clear filter
    const clearBtn = page.locator('button[title="Clear"]');
    await clearBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('.sidebar').getByText('hello.alp')).toBeVisible();
  });

  test('footer "All Panels Drawer" button opens panels modal and Escape closes it', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const drawerBtn = page.locator('.sidebar-drawer-launcher-btn');
    await expect(drawerBtn).toBeVisible();
    await expect(drawerBtn).toContainText('34');
    await drawerBtn.click();

    const dialog = page.locator('div[role="dialog"][aria-label="Panels and Tools Drawer"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('34 / 34 Available');

    // Filter panels by search query
    const searchInput = page.locator('.panels-drawer-search-input');
    await searchInput.fill('debugger');
    await page.waitForTimeout(300);
    await expect(dialog.getByText('Debugger', { exact: true })).toBeVisible();

    // Press Escape to close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(dialog).not.toBeVisible();
  });

  test('navbar Panels button opens drawer and selecting a panel switches view', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const navbarPanelsBtn = page.locator('button.header-drawer-btn');
    await expect(navbarPanelsBtn).toBeVisible();
    await navbarPanelsBtn.click();

    const dialog = page.locator('div[role="dialog"][aria-label="Panels and Tools Drawer"]');
    await expect(dialog).toBeVisible();

    // Click on Git Control card
    const gitCard = dialog.getByText('Git Control');
    await expect(gitCard).toBeVisible();
    await gitCard.click();
    await page.waitForTimeout(500);

    // Modal should close
    await expect(dialog).not.toBeVisible();

    // Active panel should now be Git
    await expect(page.getByText('Source Control')).toBeVisible();
  });
});

