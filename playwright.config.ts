import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm --prefix server run dev',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: 'npm --prefix client run dev -- --port 5175',
      url: 'http://localhost:5175',
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
