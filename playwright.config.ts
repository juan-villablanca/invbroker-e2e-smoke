import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Whitelabel Storage States
export const STORAGE_STATE_WHITELABEL = path.join(__dirname, '.auth/whitelabel.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  outputDir: 'playwright-results',
  retries: 2,
  workers: 1,
  reporter: [
    ['html']
  ],
  use: {
    navigationTimeout: 60000,
    actionTimeout: 15000,
    baseURL: 'https://web.demo.invbroker.com/',
    trace: 'on',
    headless: !!process.env.CI,
    screenshot: 'off',
    video: 'on',
    launchOptions: {
      args: ['--headless=new', '--start-maximized', '--remote-allow-origins=*'],
    },
    viewport: null,
  },
  timeout: 60000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.05,
    },
  },

  projects: [
    {
      name: 'setup-whitelabel',
      testMatch: '**/whitelabel.setup.ts',
    },
    {
      name: 'whitelabel',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE_WHITELABEL,
        baseURL: 'https://web.demo.invbroker.com/',
      },
      testMatch: ['**/*.spec.ts'],
      dependencies: ['setup-whitelabel'],
    },
  ],
});
