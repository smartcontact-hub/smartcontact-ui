import { defineConfig } from '@playwright/test';

/**
 * Config de las CAPTURAS DE ANTES Y DESPUÉS del robot de tokens (`tokens-sync.yml`).
 *
 * Aislada a propósito: no asevera nada, solo fotografía dos Supervisores ya levantados (el de `main`
 * y el del export) para que el PR enseñe cómo se ve el cambio. No tiene `webServer`: el workflow
 * sirve los dos builds estáticos y pasa sus URL en `SC_ANTES_URL` y `SC_DESPUES_URL`.
 *
 * Uso: `SC_ANTES_URL=… SC_DESPUES_URL=… SC_CAPTURAS_OUT=… npx playwright test -c playwright.capturas.config.ts`
 */
export default defineConfig({
  testDir: 'e2e/tokens-sync',
  testMatch: '*.capture.ts',
  timeout: 240_000,
  workers: 1,
  reporter: 'list',
  use: {
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  },
});
