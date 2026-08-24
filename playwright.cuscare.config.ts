import { defineConfig } from '@playwright/test';

import { reuseOnlyOwnServer } from './scripts/playwright-reuse-guard.mjs';

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
    // MOTION APAGADO — y apagado en el ORIGEN, no con CSS por encima.
    //
    // Los overlays de PrimeNG 21 entran ESCALANDO: el host `<p-motion>` va de
    // ~0.93 a 1, y como `getBoundingClientRect()` arrastra el transform del
    // ancestro, la caja de cada `<li>` cambia frame a frame aunque el `<li>` no se
    // mueva. Playwright exige la MISMA caja en dos frames seguidos para clicar, y
    // la curva tiene una cola asintótica larga: medido aquí, a 454 ms el transform
    // seguía siendo `matrix(0.999992, …)`. Con la CPU estrangulada esa cola se
    // estira más que el `timeout` de 90 s y el test muere en `element is not
    // stable` → `element was detached from the DOM`. No es la avería de los
    // loaders de 380 ms (`watchTransient`, en `e2e/cuscare/helpers.ts`): allí se
    // perdía una ventana temporal; aquí no hay ventana, es la caja que nunca se
    // queda quieta.
    //
    // A/B del 2026-08-24, 20 procesos `yes` en 10 cores (load 47-73), el mismo
    // comando las dos veces: SIN esto, `el multiselect admite VARIOS valores` cayó
    // 5 de 20 y cada caída se comía los 90 s; CON esto, 20 de 20 a 1,4 s la vuelta.
    //
    // Por qué esto y no el helper que inyecta CSS del supervisor
    // (`disableAnimations`, en `e2e/supervisor/helpers.ts`): `@primeuix/motion`
    // trae `safe: true` por defecto, así que consulta `prefers-reduced-motion` y
    // se salta la animación ENTERA. Medido parcheando `DOMTokenList.prototype.add`
    // — registra la LLAMADA, no el estado; leer `classList` desde un
    // `MutationObserver` te da el valor de cuando corre el callback, y para
    // entonces las clases ya se fueron:
    //     motion ON      → añade `p-anchored-overlay-enter-{from,active,to}`
    //     reducedMotion  → NINGUNA
    //     CSS a 0s       → las añade IGUAL; solo aplana la duración
    // Además es una línea de config en vez de un helper que hay que acordarse de
    // llamar spec a spec. El `@media (prefers-reduced-motion: reduce)` que ya
    // traen `_reset.scss` y `column-manager.component.scss` viene de propina, pero
    // NO es lo que sostiene esto.
    //
    // Nada se desvirtúa: ningún test de CusCare asevera una animación, y las
    // lecturas de métrica y color (statusbar, toast, tooltip, timeline, alto de
    // fila, ancho del sidebar, orden tras arrastrar columnas) salen IDÉNTICAS al
    // dígito con motion y sin motion — se midieron las dos veces para comprobarlo.
    //
    // ⚠️ VA DENTRO DE `contextOptions`, NO SUELTO EN `use`. En Playwright 1.60 el
    // runner ya no reenvía `reducedMotion` como opción de primer nivel: mira
    // `_combinedContextOptions` en `playwright/lib/index.js`, que enumera
    // `colorScheme`, `viewport`, etc. una por una y de `reducedMotion` no tiene
    // rastro — lo único que sobrevive es el `...contextOptions` que va delante.
    // Escrito suelto se cuela: TypeScript sí lo marca, pero ningún gate del repo
    // type-checkea los configs de la raíz (`npm run typecheck` solo entra en los
    // `tsconfig` de apps y libs) y `eslint` no reporta errores de tipo. Lo escribí
    // así primero y el test siguió cayendo 3 de 15 con la página en
    // `no-preference`: un arreglo que no arregla nada y que ningún gate desmiente.
    // Por eso el interruptor se comprueba EN LA PÁGINA y no releyendo esta config:
    // `e2e/cuscare/harness.spec.ts`.
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'retain-on-failure',
  },
  webServer: process.env['SC_CUSCARE_URL']
    ? undefined
    : {
        command: 'npm run ng -- serve cuscare --port 4415',
        url: 'http://localhost:4415',
        // Reutiliza SOLO si el server del puerto es de este árbol; si es de otra
        // sesión, para en vez de medir su código (ver el guardián).
        reuseExistingServer: reuseOnlyOwnServer(4415),
        timeout: 180_000,
      },
});
