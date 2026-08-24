import { defineConfig } from '@playwright/test';

import { reuseOnlyOwnServer } from './scripts/playwright-reuse-guard.mjs';

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
  // usage/ (captura de pantallas), supervisor/ y cuscare/ (suites propias) tienen
  // su config aparte apuntando a la app correcta — esta config sirve sc-docs.
  //
  // ⚠️ Añadir una carpeta bajo `e2e/` SIN excluirla aquí la mete en esta suite,
  // que la correría contra sc-docs. Pasó al crear `e2e/cuscare/`: en local corrí
  // `e2e:cuscare` (config propia, verde) pero no `e2e`, y el CI se puso rojo con
  // 10 tests buscando en sc-docs elementos que solo existen en cuscare.
  testIgnore: ['usage/**', 'supervisor/**', 'cuscare/**'],
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4280',
  },
  webServer: {
    command: 'npm run ng -- serve sc-docs --port 4280',
    url: 'http://localhost:4280',
    // Reutiliza SOLO si el server del puerto es de este árbol; si es de otra
    // sesión, para en vez de medir su código (ver el guardián).
    reuseExistingServer: reuseOnlyOwnServer(4280),
    timeout: 180_000,
  },
});
