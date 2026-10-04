import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * UNA TABLA DENTRO DE UNA SECCIÓN LLEGA AL PIE DE LA PANTALLA (DD-160).
 *
 * La revisión de producto del 2026-10-04, sobre la tabla de agentes de la ficha de grupo: hace scroll dentro, con la
 * cabecera fija (DD-95), pero su tope era el alto de la ventana menos 420 px fijos, sin saber dónde empieza. Medido el
 * 2026-10-04 a 1440×900: escondía 180 px de filas y dejaba 158 px vacíos bajo la tarjeta; a 1280×720, al revés, la
 * página entera desplazaba de 85 a 149 px. Como norma: si necesita más sitio, aprovecha el resto de la pantalla.
 *   1. la tarjeta de la sección acaba donde acaba la página, con su margen de pie y no más;
 *   2. la página no desplaza: lo que no cabe lo desplaza la tabla, por dentro.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

async function medir(page: Page) {
  await page.locator('sc-agent-channel-table tbody tr').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const main = document.querySelector('main#main-content')!;
    const tarjeta = document.querySelector('sc-agent-channel-table')!.closest('sc-section-card')!;
    // El margen de pie de una página: `--sc-spacing-2` (28), leído del token y no escrito aquí.
    const raiz = getComputedStyle(document.documentElement);
    const token = raiz.getPropertyValue('--sc-spacing-2').trim();
    const pie = token.endsWith('rem') ? parseFloat(token) * parseFloat(raiz.fontSize) : parseFloat(token);
    return {
      hueco: Math.round(innerHeight - tarjeta.getBoundingClientRect().bottom),
      pie,
      paginaDesplaza: main.scrollHeight - main.clientHeight,
    };
  });
}

for (const [ancho, alto] of [
  [1440, 900],
  [1280, 720],
] as const) {
  test(`a ${ancho}×${alto}, la sección de agentes llega al pie y la página no desplaza`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: alto });
    await goto(page, 'admin/grupos/editar/11?seccion=agentes');
    const m = await medir(page);
    expect(m.paginaDesplaza, 'lo que la página desplaza').toBeLessThanOrEqual(0);
    expect(m.hueco, 'bajo la tarjeta, el margen de pie de la página y no más').toBeLessThanOrEqual(m.pie + 1);
  });
}
