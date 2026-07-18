import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  // usage/ (captura de pantallas) y supervisor/ (suite propia) tienen su config
  // aparte apuntando a la app correcta — esta config sirve sc-demo.
  testIgnore: ['usage/**', 'supervisor/**'],
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
