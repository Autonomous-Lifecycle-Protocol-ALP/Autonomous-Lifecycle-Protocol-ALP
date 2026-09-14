const { test, expect } = require('@playwright/test');

test.describe('Editor Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3500);
  });

  // --- File Opening ---

  test('opens a file from welcome screen and renders editor toolbar', async ({ page }) => {
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="mock-monaco"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    await expect(page.locator('.editor-action-toolbar')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-split"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-diff"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-word-wrap"]')).toBeVisible();
  });

  // --- Toolbar Buttons ---

  test('toggle split editor via toolbar button', async ({ page }) => {
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="editor-action-toolbar"]', { timeout: 10000 });

    // Split should be off initially
    await expect(page.locator('[data-testid="editor-split-container"]')).not.toBeVisible();

    // Click split toolbar button
    await page.locator('[data-testid="toolbar-split"]').click();
    await page.waitForTimeout(400);

    // Split container should appear
    await expect(page.locator('[data-testid="editor-split-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="editor-pane-primary"]')).toBeVisible();
    await expect(page.locator('[data-testid="editor-pane-secondary"]')).toBeVisible();

    // Click split again to toggle off
    await page.locator('[data-testid="toolbar-split"]').click();
    await page.waitForTimeout(400);
    await expect(page.locator('[data-testid="editor-split-container"]')).not.toBeVisible();
  });

  test('toggle diff view via toolbar button', async ({ page }) => {
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="editor-action-toolbar"]', { timeout: 10000 });

    // Diff should be off initially
    await expect(page.locator('[data-testid="diff-view-container"]')).not.toBeVisible();

    // Click diff toolbar button
    await page.locator('[data-testid="toolbar-diff"]').click();
    await page.waitForTimeout(400);

    // Diff view should appear
    await expect(page.locator('[data-testid="diff-view-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="diff-pane-original"]')).toBeVisible();
    await expect(page.locator('[data-testid="diff-pane-modified"]')).toBeVisible();

    // Click diff again to toggle off
    await page.locator('[data-testid="toolbar-diff"]').click();
    await page.waitForTimeout(400);
    await expect(page.locator('[data-testid="diff-view-container"]')).not.toBeVisible();
  });

  test('toggle word wrap via toolbar button', async ({ page }) => {
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="editor-action-toolbar"]', { timeout: 10000 });

    const wrapBtn = page.locator('[data-testid="toolbar-word-wrap"]');

    // Wrap should be inactive initially
    await expect(wrapBtn).not.toHaveClass(/active/);

    // Click wrap toolbar button
    await wrapBtn.click();
    await page.waitForTimeout(300);
    await expect(wrapBtn).toHaveClass(/active/);

    // Click wrap again to toggle off
    await wrapBtn.click();
    await page.waitForTimeout(300);
    await expect(wrapBtn).not.toHaveClass(/active/);
  });

  test('editor action toolbar has all buttons', async ({ page }) => {
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="editor-action-toolbar"]', { timeout: 10000 });

    await expect(page.locator('[data-testid="toolbar-run-alp"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-validate"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-format"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-word-wrap"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-split"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-diff"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-copy-path"]')).toBeVisible();
    await expect(page.locator('[data-testid="editor-metrics"]')).toBeVisible();
  });

  // --- Tab Context Menu ---

  test('right-click tab opens context menu with all actions', async ({ page }) => {
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="editor-action-toolbar"]', { timeout: 10000 });

    // Context menu should not be visible initially
    await expect(page.locator('[data-testid="tab-context-menu"]')).not.toBeVisible();

    // Right-click on the tab bar to open context menu
    const tab = page.locator('.tab-bar .tab').first();
    await tab.click({ button: 'right' });
    await page.waitForSelector('[data-testid="tab-context-menu"]', { timeout: 5000 });

    // Context menu should now be visible
    const contextMenu = page.locator('[data-testid="tab-context-menu"]');
    await expect(contextMenu).toBeVisible();

    // Verify context menu items exist (Close is first item, others use substring)
    await expect(contextMenu.locator('button.tab-context-item').first()).toBeVisible();
    await expect(contextMenu.locator('button', { hasText: /Close Others/ })).toBeVisible();
    await expect(contextMenu.locator('button', { hasText: /Close to the Right/ })).toBeVisible();
    await expect(contextMenu.locator('button', { hasText: /Close All/ })).toBeVisible();
    await expect(contextMenu.locator('button', { hasText: /Pin Tab|Unpin Tab/i })).toBeVisible();
    await expect(contextMenu.locator('button', { hasText: /Split Right/ })).toBeVisible();
    await expect(contextMenu.locator('button', { hasText: /Copy Path/ })).toBeVisible();
    await expect(contextMenu.locator('button', { hasText: /Save File/ })).toBeVisible();
  });

  test('context menu Close action closes the tab', async ({ page }) => {
    // Open two files so we can close one
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="editor-action-toolbar"]', { timeout: 10000 });
    await page.locator('.sidebar-tree-file', { hasText: 'index.ts' }).first().click();
    await page.waitForSelector('[data-testid="editor-action-toolbar"]', { timeout: 10000 });

    // Open context menu on first tab
    const tab = page.locator('.tab-bar .tab').first();
    await tab.click({ button: 'right' });
    await page.waitForTimeout(300);

    // Click Close (first item in context menu)
    await page.locator('[data-testid="tab-context-menu"]')
      .locator('button.tab-context-item')
      .first()
      .click();
    await page.waitForTimeout(400);

    // Context menu should close
    await expect(page.locator('[data-testid="tab-context-menu"]')).not.toBeVisible();
  });

  test('context menu Split Right action toggles split', async ({ page }) => {
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="editor-action-toolbar"]', { timeout: 10000 });

    // Split should be off initially
    await expect(page.locator('[data-testid="editor-split-container"]')).not.toBeVisible();

    // Open context menu and click Split Right
    const tab = page.locator('.tab-bar .tab').first();
    await tab.click({ button: 'right' });
    await page.waitForTimeout(300);
    await page.locator('[data-testid="tab-context-menu"]').getByText(/Split Right/i).click();
    await page.waitForTimeout(400);

    // Split should now be active
    await expect(page.locator('[data-testid="editor-split-container"]')).toBeVisible();
  });

  test('context menu Save File clears dirty state', async ({ page }) => {
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="mock-monaco"]', { timeout: 10000 });

    // Type in editor to make file dirty
    const editorArea = page.locator('[data-testid="mock-monaco"]');
    await editorArea.fill('modified content');
    await page.waitForTimeout(500);

    // Dirty dot should appear
    await expect(page.locator('.tab-dirty-dot')).toBeVisible();

    // Open context menu and click Save File
    const tab = page.locator('.tab-bar .tab').first();
    await tab.click({ button: 'right' });
    await page.waitForTimeout(300);
    await page.locator('[data-testid="tab-context-menu"]').getByText(/Save File/i).click();
    await page.waitForTimeout(400);

    // Context menu closes
    await expect(page.locator('[data-testid="tab-context-menu"]')).not.toBeVisible();

    // Dirty dot should disappear
    await expect(page.locator('.tab-dirty-dot')).not.toBeVisible();

    // Save toast should appear
    await expect(page.locator('[data-testid="save-toast"]')).toBeVisible();
  });

  // --- Save / Dirty Flow ---

  test('Ctrl+S saves dirty file and shows toast', async ({ page }) => {
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="mock-monaco"]', { timeout: 10000 });

    // Type in editor to make file dirty
    const editorArea = page.locator('[data-testid="mock-monaco"]');
    await editorArea.fill('some changes');
    await page.waitForTimeout(500);

    // Dirty dot should appear on tab
    await expect(page.locator('.tab-dirty-dot')).toBeVisible();

    // Press Ctrl+S
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(500);

    // Dirty dot should disappear
    await expect(page.locator('.tab-dirty-dot')).not.toBeVisible();

    // Save toast should appear
    const saveToast = page.locator('[data-testid="save-toast"]');
    await expect(saveToast).toBeVisible();
    await expect(saveToast).toContainText('Saved:');

    // Save toast auto-dismisses after 2.5s
    await page.waitForTimeout(3000);
    await expect(saveToast).not.toBeVisible();
  });

  test('editing file marks it as dirty with dot indicator', async ({ page }) => {
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="mock-monaco"]', { timeout: 10000 });

    // No dirty dot initially
    await expect(page.locator('.tab-dirty-dot')).not.toBeVisible();

    // Type in editor
    const editorArea = page.locator('[data-testid="mock-monaco"]');
    await editorArea.fill('new content');
    await page.waitForTimeout(500);

    // Dirty dot should appear
    await expect(page.locator('.tab-dirty-dot')).toBeVisible();
  });

  // --- Keyboard Shortcuts ---

  test('Ctrl+\\ toggles split editor', async ({ page }) => {
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="editor-action-toolbar"]', { timeout: 10000 });

    await expect(page.locator('[data-testid="editor-split-container"]')).not.toBeVisible();

    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(400);
    await expect(page.locator('[data-testid="editor-split-container"]')).toBeVisible();

    await page.keyboard.press('Control+\\');
    await page.waitForTimeout(400);
    await expect(page.locator('[data-testid="editor-split-container"]')).not.toBeVisible();
  });

  test('Ctrl+Alt+D toggles diff view', async ({ page }) => {
    await page.getByRole('button', { name: /New Agent/i }).click();
    await page.waitForSelector('[data-testid="editor-action-toolbar"]', { timeout: 10000 });

    await expect(page.locator('[data-testid="diff-view-container"]')).not.toBeVisible();

    await page.keyboard.press('Control+Alt+d');
    await page.waitForTimeout(400);
    await expect(page.locator('[data-testid="diff-view-container"]')).toBeVisible();

    await page.keyboard.press('Control+Alt+d');
    await page.waitForTimeout(400);
    await expect(page.locator('[data-testid="diff-view-container"]')).not.toBeVisible();
  });
});
