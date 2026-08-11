import { defineConfig } from '@playwright/test';

/**
 * Config del e2e de COMPORTAMIENTO de CusCare. Aislada de las otras tres, con el
 * mismo patrón que `playwright.supervisor.config.ts`:
 *  - `playwright.config.ts` sirve sc-docs (:4280) → métricas de token + baselines,
 *  - `playwright.usage.config.ts` sirve el supervisor (:4290), generador de capturas,
 *  - `playwright.supervisor.config.ts` (:4405) conduce la app real del supervisor,
 *  - esta (:4415) conduce CusCare.
 *
 * Puerto propio para no chocar con ninguno de los anteriores ni con el
 * `ng serve` de trabajo (:4295).
 *
 * Por qué Playwright y no `javascript_tool`: estos tests comprueban GESTOS
 * (clicar el engranaje, navegar el sidebar, cambiar de pestaña). `dispatchEvent`
 * se salta el hit-testing y da verdes falsos — un elemento tapado por un overlay
 * "responde" igual. Playwright clica de verdad, con hit-testing.
 *
 * Sin backend: CusCare pinta de `data/seed.ts`, así que basta el dev server y es
 * determinista.
 *
 * Uso: `npm run e2e:cuscare`.
 */
export default defineConfig({
  testDir: 'e2e/cuscare',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: process.env['CI'] ? 'list' : 'line',
  use: {
    baseURL: process.env['SC_CUSCARE_URL'] ?? 'http://localhost:4415',
    // El mismo viewport en el que se MIDIÓ el sitio real: la app escala con
    // `font-size: 0.8vw`, así que a otro ancho las medidas no casarían.
    viewport: { width: 1460, height: 792 },
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },
  webServer: process.env['SC_CUSCARE_URL']
    ? undefined
    : {
        command: 'npm run ng -- serve cuscare --port 4415',
        url: 'http://localhost:4415',
        reuseExistingServer: !process.env['CI'],
        timeout: 180_000,
      },
});
