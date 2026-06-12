import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4280',
  },
  webServer: {
    command: 'npm run ng -- serve sc-demo --port 4280',
    url: 'http://localhost:4280',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
