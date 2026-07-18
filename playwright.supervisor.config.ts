import { defineConfig } from '@playwright/test';

/**
 * Config del e2e de COMPORTAMIENTO del Supervisor. Aislada de las otras dos a
 * propósito:
 *  - `playwright.config.ts` sirve sc-demo (:4280) → métricas de token + baselines,
 *  - `playwright.usage.config.ts` sirve el supervisor (:4290) pero es un GENERADOR
 *    de capturas sin aserciones (y escribe artefactos compartidos),
 *  - esta (:4405) conduce la app real y **asevera**: rellenar → validar → guardar.
 *
 * Puerto propio: :4290 lo ocupa la captura de uso y :4400 el `ng serve` de trabajo.
 *
 * Sin backend: el Supervisor renderiza de stores con SEED (+ localStorage en el
 * área admin), así que basta el dev server. Ojo con los stores de `memory`
 * (rules/categories/entities): viven **en memoria**, sin persistencia — un
 * `page.reload()` a mitad de journey borra lo creado. Navegar por la SPA, nunca
 * recargar.
 *
 * Uso: `npm run e2e:supervisor`.
 */
export default defineConfig({
  testDir: 'e2e/supervisor',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  // Serial: los journeys comparten el mismo dev server y algunos siembran datos.
  workers: 1,
  reporter: process.env['CI'] ? 'list' : 'line',
  use: {
    baseURL: process.env['SC_SUPERVISOR_URL'] ?? 'http://localhost:4405',
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    trace: 'retain-on-failure',
  },
  // Playwright levanta y espera el dev server. `ng serve` en vez de un estático
  // sobre `dist`: no añade dependencias nuevas (http-server/wait-on no están en
  // el repo y bajarlas con npx en CI es lento y una sorpresa de cadena de
  // suministro). `SC_SUPERVISOR_URL` permite apuntar a un servidor ya levantado.
  webServer: process.env['SC_SUPERVISOR_URL']
    ? undefined
    : {
        command: 'npm run ng -- serve supervisor --port 4405',
        url: 'http://localhost:4405',
        reuseExistingServer: !process.env['CI'],
        timeout: 180_000,
      },
});
