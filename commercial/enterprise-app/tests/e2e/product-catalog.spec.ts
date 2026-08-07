import { test, expect } from '@playwright/test';

test.describe('Product Catalog E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await page.fill('input[type="email"]', 'demo@alp-enterprise.com');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(1000);
  });

  test('navigates to product catalog', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'ALP Product Suite' })).toBeVisible();
  });

  test('opens a product detail page from catalog', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const productLink = page.getByRole('link', { name: /ALP Cloud Workspace/ });
    await expect(productLink).toBeVisible();
    await productLink.click();
    await page.waitForURL('**/products/cloud-workspace');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'ALP Cloud Workspace' })).toBeVisible();
  });

  test('navigates between multiple products', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const products = [
      { name: 'ALP Cloud Workspace', url: '**/products/cloud-workspace' },
      { name: 'ALP Mobile App', url: '**/products/mobile-app' },
      { name: 'ALP Agent Studio', url: '**/products/agent-studio' },
      { name: 'ALP Security Scanner', url: '**/products/security-scanner' },
      { name: 'ALP Analytics & BI', url: '**/products/analytics-bi' },
      { name: 'ALP DevOps Bridge', url: '**/products/devops-bridge' },
      { name: 'ALP AI Model Hub', url: '**/products/model-hub' },
      { name: 'ALP Data Pipeline Studio', url: '**/products/data-pipeline-studio' },
      { name: 'ALP Hybrid Engineer AI', url: '**/products/hybrid-engineer' },
      { name: 'ALP Quantum Engineering AI', url: '**/products/quantum-engineer' },
      { name: 'ALP Chip Design Studio', url: '**/products/chip-design-studio' },
      { name: 'ALP SOC Sentinel AI', url: '**/products/soc-sentinel' },
      { name: 'ALP Threat Intelligence Engine', url: '**/products/threat-intel' },
      { name: 'ALP Zero Trust Orchestrator', url: '**/products/zero-trust' },
    ];

    for (const product of products) {
      await page.goto('/products');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      const link = page.getByRole('link', { name: product.name });
      await expect(link).toBeVisible();
      await link.click();
      await page.waitForURL(product.url);
      await page.waitForTimeout(500);

      await expect(page.getByRole('heading', { name: product.name })).toBeVisible();
    }
  });

  test('loads real data from API on Analytics BI page', async ({ page }) => {
    await page.goto('/products/analytics-bi');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: 'Dashboards' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
  });

  test('loads real data from API on DevOps Bridge page', async ({ page }) => {
    await page.goto('/products/devops-bridge');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await expect(page.getByRole('heading', { name: 'Your Pipelines' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Deployments' })).toBeVisible();
  });

  test('creates a pipeline via DevOps Bridge page', async ({ page }) => {
    await page.goto('/products/devops-bridge');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const pipelineName = `E2E Pipeline ${Date.now()}`;
    page.on('dialog', async (dialog) => {
      await dialog.accept(pipelineName);
    });

    await page.click('text=Create Pipeline');
    await page.waitForTimeout(1000);

    page.on('dialog', async (dialog) => {
      await dialog.accept('github');
    });
    await page.waitForTimeout(1000);

    await expect(page.getByText(pipelineName)).toBeVisible({ timeout: 10000 });
  });

  test('creates a dashboard via Analytics BI page', async ({ page }) => {
    await page.goto('/products/analytics-bi');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const dashboardName = `E2E Dashboard ${Date.now()}`;
    page.on('dialog', async (dialog) => {
      await dialog.accept(dashboardName);
    });

    await page.click('text=Create Dashboard');
    await page.waitForTimeout(1000);

    await expect(page.getByText(dashboardName)).toBeVisible({ timeout: 10000 });
  });

  test('creates a workflow via Agent Studio page', async ({ page }) => {
    await page.goto('/products/agent-studio');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const workflowName = `E2E Workflow ${Date.now()}`;
    page.on('dialog', async (dialog) => {
      await dialog.accept(workflowName);
    });

    await page.click('text=Create Workflow');
    await page.waitForTimeout(1000);

    await expect(page.getByText(workflowName)).toBeVisible({ timeout: 10000 });
  });

  test('creates a scan via Security Scanner page', async ({ page }) => {
    await page.goto('/products/security-scanner');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const scanName = `E2E Scan ${Date.now()}`;
    page.on('dialog', async (dialog) => {
      await dialog.accept(scanName);
    });

    await page.click('text=New Scan');
    await page.waitForTimeout(1000);

    await expect(page.getByText(scanName)).toBeVisible({ timeout: 10000 });
  });

  test('loads remaining product pages without runtime errors', async ({ page }) => {
    const pages = [
      { path: '/products/cloud-workspace', heading: 'ALP Cloud Workspace' },
      { path: '/products/model-hub', heading: 'ALP AI Model Hub' },
      { path: '/products/mobile-app', heading: 'ALP Mobile App' },
      { path: '/products/soc-sentinel', heading: 'ALP SOC Sentinel AI' },
      { path: '/products/threat-intel', heading: 'ALP Threat Intelligence Engine' },
      { path: '/products/zero-trust', heading: 'ALP Zero Trust Orchestrator' },
      { path: '/products/quantum-engineer', heading: 'ALP Quantum Engineering AI' },
      { path: '/products/chip-design-studio', heading: 'ALP Chip Design Studio' },
      { path: '/products/hybrid-engineer', heading: 'ALP Hybrid Engineer AI' },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      await expect(page.getByRole('heading', { name: p.heading })).toBeVisible();
    }
  });
});
