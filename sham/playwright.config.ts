const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const __dirname = path.dirname(__filename);

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testDir: './tests/e2e',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
