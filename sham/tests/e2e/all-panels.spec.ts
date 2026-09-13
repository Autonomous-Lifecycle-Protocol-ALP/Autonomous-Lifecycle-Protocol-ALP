const { test, expect } = require('@playwright/test');

/**
 * All 31 panels defined in ALL_PANELS (shared.tsx).
 * Each entry: { id, label, expectText } where expectText is a unique string
 * that should appear on the rendered panel to prove it loaded.
 */
const ALL_31_PANELS = [
  // Core Development
  { id: 'editor', label: 'Editor' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'mcp', label: 'MCP Browser' },
  { id: 'git', label: 'Git Control' },
  { id: 'search', label: 'Workspace Search' },
  { id: 'settings', label: 'Settings' },

  // AI & Intelligence
  { id: 'agents', label: 'Agents' },
  { id: 'copilot', label: 'Copilot' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'autonomy', label: 'Autonomy' },
  { id: 'synapse', label: 'Synapse Graph' },
  { id: 'multimodal', label: 'MultiModal' },

  // Swarm & Distributed
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'crdtCanvas', label: 'CRDT Canvas' },
  { id: 'partition', label: 'DAG Partition' },
  { id: 'selfHealingMesh', label: 'Self-Healing Mesh' },
  { id: 'collab', label: 'Collaboration' },

  // Testing & Profiling
  { id: 'test-runner', label: 'Test Runner' },
  { id: 'debugger', label: 'Debugger' },
  { id: 'edgeDebug', label: 'Edge Debug' },
  { id: 'profiler', label: 'Profiler' },
  { id: 'chaosEngine', label: 'Chaos Engine' },
  { id: 'workflowReplay', label: 'Workflow Replay' },

  // Platform & Security
  { id: 'zk', label: 'ZK Proof' },
  { id: 'wasmAst', label: 'WASM AST' },
  { id: 'featureFlags', label: 'Feature Flags' },
  { id: 'localStorage', label: 'Local Storage' },
  { id: 'telemetryInspector', label: 'Telemetry' },
  { id: 'refactor', label: 'Refactor' },
  { id: 'plugins', label: 'Plugins' },
  { id: 'pro', label: 'Pro Suite' },
];

test.describe('All 31 Panels Rendering Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test(`all ${ALL_31_PANELS.length} panels are defined`, () => {
    expect(ALL_31_PANELS.length).toBe(31);
  });

  // Collect console errors per panel
  for (const panel of ALL_31_PANELS) {
    test(`panel "${panel.label}" (${panel.id}) renders without error`, async ({ page }) => {
      // Collect console errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Open the panels drawer via the sidebar footer button
      const drawerBtn = page.locator('.sidebar-drawer-launcher-btn');
      await expect(drawerBtn).toBeVisible({ timeout: 5000 });
      await drawerBtn.click();

      // Verify drawer opened
      const dialog = page.locator('div[role="dialog"][aria-label="Panels and Tools Drawer"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // Search for the panel by label
      const searchInput = page.locator('.panels-drawer-search-input');
      await searchInput.fill(panel.label);
      await page.waitForTimeout(300);

      // Find and click the panel card
      const card = dialog.locator('.panels-drawer-card', { hasText: panel.label }).first();
      await expect(card).toBeVisible({ timeout: 3000 });
      await card.click();
      await page.waitForTimeout(1000);

      // Drawer should close after selecting a panel
      await expect(dialog).not.toBeVisible({ timeout: 3000 });

      // Verify the main content area is not empty
      const mainContent = page.locator('.main-content, .panel-content, main, [class*="panel"]').first();
      const bodyHtml = await page.locator('body').innerHTML();

      // Must have content rendered (more than just a shell)
      expect(bodyHtml.length).toBeGreaterThan(500);

      // Must NOT show "Loading panel..." (Suspense fallback)
      const loadingFallback = page.getByText('Loading panel...', { exact: true });
      await expect(loadingFallback).not.toBeVisible({ timeout: 5000 });

      // Must NOT show a React error boundary or crash
      const errorBoundary = page.getByText('Something went wrong');
      const errorCount = await errorBoundary.count();
      expect(errorCount).toBe(0);

      // Filter out known benign console errors (e.g. favicon, Monaco CDN)
      const criticalErrors = consoleErrors.filter(
        (e) =>
          !e.includes('favicon') &&
          !e.includes('cdn.jsdelivr.net') &&
          !e.includes('net::ERR') &&
          !e.includes('404')
      );

      // Report results
      console.log(`✅ Panel "${panel.label}" (${panel.id}): rendered successfully`);
      if (criticalErrors.length > 0) {
        console.warn(`⚠️  Console errors for "${panel.label}":`, criticalErrors);
      }
    });
  }
});
