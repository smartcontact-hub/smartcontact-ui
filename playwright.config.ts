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
  /* `SC_DOCS_URL` apunta la suite a un servidor YA levantado y se salta el
   * `webServer` entero — el mismo escape que ya tenían `SC_SUPERVISOR_URL` y
   * `SC_CUSCARE_URL`. Esta config era la única de las tres sin él, y se notaba:
   * el puerto está FIJO, así que con dos worktrees de agente vivos a la vez el
   * segundo muere con "Port 4280 is already in use" sin correr un test. El
   * guardián `reuseOnlyOwnServer` cubre el otro lado del mismo problema: si en
   * el puerto hay un server de OTRO árbol, para en vez de medir su código.
   *
   * Y hay una segunda razón, más útil que la de los puertos: para MEDIR color
   * o valores computados, un `ng serve` puede servir CSS viejo aunque el
   * fuente y el bundle estén bien. Con esto se apunta a un build estático
   * (`ng build sc-docs` → `http-server dist/sc-docs`) y se acabó la duda.
   *
   * ⚠️ PERO no apuntes el `component-structure` a un build de PRODUCCIÓN: su
   * baseline guarda `outerHTML`, y Angular escribe los nodos-comentario como
   * `<!--container-->` en desarrollo y `<!---->` en producción. Salen 16 filas
   * en rojo que no son una regresión, solo otra configuración de build. Para
   * ese test, `ng serve … --port <libre>` y `SC_DOCS_URL` a ese puerto. */
  use: {
    baseURL: process.env['SC_DOCS_URL'] ?? 'http://localhost:4280',
  },
  webServer: process.env['SC_DOCS_URL']
    ? undefined
    : {
        command: 'npm run ng -- serve sc-docs --port 4280',
        url: 'http://localhost:4280',
        // Reutiliza SOLO si el server del puerto es de este árbol; si es de otra
        // sesión, para en vez de medir su código (ver el guardián).
        reuseExistingServer: reuseOnlyOwnServer(4280),
        timeout: 180_000,
      },
});
