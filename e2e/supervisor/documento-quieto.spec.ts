import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA PÁGINA SE DESPLAZA DENTRO DE LA APP, NUNCA EL DOCUMENTO.
 *
 * La app se desplaza en su zona de contenido (`main.app-shell__content`); la barra de arriba, el menú y lo que va
 * fijo (el índice y el resumen de las fichas) cuentan con ello. Medido el 2026-10-01, en Distribución y colas a
 * 1490×860: el `<input type="file">` oculto de «Música de espera» (`.visually-hidden`, `position: absolute`) no tenía
 * ningún antepasado posicionado, así que se colgaba del documento y lo alargaba (160 px en el grupo 1, 206 en el 11,
 * 147 en el alta). Al llegar al final de la página, la rueda seguía con el documento: se iba la barra de arriba, el
 * índice y el resumen se cortaban por arriba y debajo quedaba una franja gris.
 *
 * Lo que fija:
 *   1. Bajando con la rueda hasta el final de la sección más larga, el documento no se mueve: la barra se ve, y el
 *      índice y el resumen están enteros.
 *   2. Lo mismo en el alta, en su paso de Distribución y colas.
 *   3. En las pantallas largas, el documento mide lo que la ventana: nada se cuelga de él por debajo.
 */

test.use({ viewport: { width: 1490, height: 860 } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Lo que el documento se desplaza de más sobre la ventana. 0 = nada se cuelga de él. */
const sobraDelDocumento = (page: Page) =>
  page.evaluate(() => document.scrollingElement!.scrollHeight - window.innerHeight);

/** Baja con la rueda, sobre el contenido, más de lo que mide la página. */
const bajarDelTodo = async (page: Page) => {
  await page.mouse.move(800, 500);
  for (let i = 0; i < 30; i++) await page.mouse.wheel(0, 500);
  // Llega al final de la zona de contenido: si no, la prueba no habría bajado lo bastante para ver el fallo.
  await expect
    .poll(() => page.locator('main#main-content').evaluate((m) => Math.round(m.scrollHeight - m.clientHeight - m.scrollTop)))
    .toBeLessThanOrEqual(1);
};

const cajas = (page: Page) =>
  page.evaluate(() => {
    const top = (sel: string) => {
      const el = document.querySelector(sel);
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    };
    return {
      documento: document.scrollingElement!.scrollTop,
      barra: top('header.top-bar'),
      indice: top('.page__rail'),
      resumen: top('.ficha-summary'),
    };
  });

test('grupo 11 · al bajar del todo en Distribución y colas, el documento no se mueve y nada se corta', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=distribucion');
  await expect(page.locator('#group-section-distribution')).toBeVisible();
  await bajarDelTodo(page);

  const m = await cajas(page);
  expect(m.documento, 'el documento se desplazó').toBe(0);
  expect(m.barra, 'la barra de arriba').toBe(0);
  expect(m.indice!, 'el índice, entero').toBeGreaterThanOrEqual(0);
  expect(m.resumen!, 'el resumen, entero').toBeGreaterThanOrEqual(0);
});

test('alta de grupo · en su paso de Distribución y colas, tampoco', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill(`E2E Documento ${Date.now()}`);
  await page.getByRole('tablist', { name: 'Pasos del alta' }).getByRole('tab', { name: /Distribución/ }).click();
  await expect(page.locator('#group-section-distribution')).toBeVisible();
  await bajarDelTodo(page);

  const m = await cajas(page);
  expect(m.documento, 'el documento se desplazó').toBe(0);
  expect(m.barra, 'la barra de arriba').toBe(0);
  expect(m.resumen!, 'el resumen, entero').toBeGreaterThanOrEqual(0);
});

for (const ruta of [
  'admin/grupos/editar/1?seccion=distribucion',
  'admin/grupos/editar/11?seccion=recursos',
  'admin/agentes/editar/1?seccion=avanzado',
  'admin/usuarios/editar/1?seccion=acceso',
  'config/aed/grupos',
  'admin/grupos',
  'dashboard',
]) {
  test(`${ruta} · el documento mide lo que la ventana`, async ({ page }) => {
    await goto(page, ruta);
    await page.waitForLoadState('networkidle');
    expect(await sobraDelDocumento(page)).toBe(0);
  });
}
