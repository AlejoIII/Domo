import { defineConfig, devices } from '@playwright/test';

const ci = !!process.env.CI;
const fullStack = process.env.E2E_FULL_STACK === '1';
const usePreview = ci || fullStack;
const baseURL = usePreview
  ? 'http://127.0.0.1:4173'
  : (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173');

const backendHealthUrl = `${process.env.E2E_BACKEND_URL ?? 'http://127.0.0.1:3000'}/api/v1/health`;

const previewServer = {
  command: 'npm run preview -- --port 4173 --host 127.0.0.1',
  url: baseURL,
  reuseExistingServer: !ci,
  timeout: 120_000,
};

const devServer = {
  command: 'npm run dev',
  url: baseURL,
  reuseExistingServer: true,
  timeout: 120_000,
};

const backendServer = {
  command: 'node scripts/start-backend-e2e.mjs',
  url: backendHealthUrl,
  reuseExistingServer: !ci,
  timeout: 180_000,
};

const webServer = fullStack
  ? [backendServer, usePreview ? previewServer : devServer]
  : usePreview
    ? previewServer
    : devServer;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: !fullStack,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  workers: ci || fullStack ? 1 : undefined,
  reporter: ci ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer,
});
