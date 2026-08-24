import type { Page } from '@playwright/test';

/**
 * Mata animaciones y view-transitions ANTES del primer paint.
 *
 * Vivía solo en `e2e/supervisor/helpers.ts`; se comparte desde aquí el
 * 2026-08-24 al descubrir que la red de severidades la necesitaba por un motivo
 * DISTINTO al original, y que sin ella era inestable.
 *
 *  · En el supervisor evita que Playwright rechace overlays animados por
 *    "element is not stable" — un falso fallo del arnés.
 *  · En la red de severidades evita algo peor: un falso VERDE/ROJO alternante.
 *    Un toast entra animado, así que medido a mitad de transición su opacidad
 *    todavía no es 1 y el fondo EFECTIVO que compone la sonda sale distinto en
 *    cada vuelta. Medido: 3 vueltas sobre el MISMO árbol daban 2 verdes y 1 rojo
 *    (`p-toast-summary` de danger oscilando alrededor de 4.45-4.5:1).
 *
 * Es el caso de libro de la regla que ya está escrita en `LEARNINGS`: cuando un
 * test mira un TRANSITORIO, la carga de la máquina es el disparador, no la
 * causa. Re-correrlo con la máquina libre lo esconde; apagar el motion en el
 * origen lo arregla.
 */
export const disableAnimations = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = `*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;}
::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important;}`;
    document.addEventListener('DOMContentLoaded', () => document.head.append(style));
    queueMicrotask(() => document.head?.append(style));
  });
};
