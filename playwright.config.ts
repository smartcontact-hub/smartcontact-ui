import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  /* Tolerancia de las baselines visuales (`components.spec.ts`).
   *
   * Sin ella, CUALQUIER píxel distinto falla, y `sc-radiobutton` es flaky por
   * causas ajenas al diseño: entre capturas la página mide 1305px o 1308px de
   * ancho —una barra de scroll que aparece y desaparece tras el click— y aun
   * estabilizada quedan 4 píxeles.
   *
   * 20 es holgado para ese ruido y sigue siendo diminuto contra un cambio real:
   * medido, cambiar UNA letra en una story da **1501** píxeles, 75× este techo.
   * No subir esto para callar un fallo sin mirar antes el diff: los 25 rojos que
   * esto NO arregla (y que se regeneraron aparte) medían entre 94.000 y 651.000.
   */
  expect: { toHaveScreenshot: { maxDiffPixels: 20 } },
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
