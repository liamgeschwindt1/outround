const { defineConfig } = require('@playwright/test');
const path = require('node:path');

// Config is in app/e2e/ — the webServer needs to run from app/
const APP_DIR = path.resolve(__dirname, '..');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30000,
  expect: { timeout: 10000 },

  use: {
    baseURL: 'http://localhost:3000',
    // Disabled by default — enable for debugging via CLI flags:
    //   --screenshot on   --video on   --trace on
    screenshot: 'off',
    video: 'off',
    trace: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      cwd: APP_DIR,
      timeout: 30000,
    },
  ],
});
