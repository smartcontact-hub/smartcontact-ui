import { defineConfig } from '@playwright/test';

import { reuseOnlyOwnServer } from './scripts/playwright-reuse-guard.mjs';

/**
 * Config AISLADA para la captura de la galería de uso (Fase 2.2). Separada de
 * `playwright.config.ts` a propósito: aquella sirve sc-docs (:4280) y de ella
 * dependen los baselines visuales — esta sirve el SUPERVISOR (:4290) para
 * fotografiar el flujo real. Puertos distintos → `reuseExistingServer`
 * independiente; `npm run e2e` queda intacto.
 *
 * El Supervisor renderiza sin backend (stores con SEED + localStorage), así que
 * la captura es determinista. Ver `e2e/usage/usage-capture.spec.ts`.
 *
 * Uso (vía npm): `npm run usage:capture`.
 */
export default defineConfig({
  testDir: 'e2e/usage',
  timeout: 120_000,
  // Un solo worker: la captura escribe artefactos compartidos (_usage-raw.json).
  workers: 1,
  use: {
    baseURL: 'http://localhost:4290',
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  },
  webServer: {
    command: 'npm run ng -- serve supervisor --port 4290',
    url: 'http://localhost:4290',
    // Reutiliza SOLO si el server del puerto es de este árbol; si es de otra
    // sesión, para en vez de medir su código (ver el guardián).
    reuseExistingServer: reuseOnlyOwnServer(4290),
    timeout: 180_000,
  },
});
