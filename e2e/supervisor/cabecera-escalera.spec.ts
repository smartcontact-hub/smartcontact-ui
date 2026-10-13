import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA CABECERA DE LAS LISTAS SUBE POR LA ESCALERA 7 · 14 · 28 (DD-192).
 *
 * Medido el 2026-10-11 a 1440 en las 16 listas: barra → título 17,5, título → buscador 14 y buscador → tabla 12,25.
 * DD-94 ya pedía que el buscador fuese de la tabla (más cerca de ella que del título), pero 12,25 contra 14 no se
 * distingue, y ninguno de los tres huecos estaba en la escalera de AGENTS §«UX de pantalla» 9. Ahora cada frontera tiene
 * su peldaño:
 *   - de la barra al título, 28: lo mismo que del menú al título, el borde de todas las páginas;
 *   - del título a lo que titula (pestañas, buscador o la tabla), 14, y de unas pestañas a su buscador, también 14;
 *   - del buscador o los filtros a su tabla, 7.
 * El borde lo pone el molde (`.page__inner`, `styles/_page.scss`), una vez; antes lo copiaban ocho hojas.
 *
 * `agrupacion.spec.ts` no ve títulos ni tablas (lo dice en «QUÉ NO VE»): esto es lo que mide la cabecera.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
  await page.setViewportSize({ width: 1440, height: 900 });
});

/** Las listas del molde común (`sc-list-page`) con buscador: título, barra y tabla. */
const LISTAS = [
  'admin/agentes',
  'admin/grupos',
  'admin/usuarios',
  'admin/equipos',
  'admin/labels',
  'admin/agendas',
  'admin/tipificaciones',
  'admin/horarios',
  'admin/variables',
  'admin/entidades',
  'admin/intenciones',
  'admin/clasificacion-ia',
  'admin/entidades-ia',
  'admin/reglas-ia',
] as const;

/** El borde de abajo de la barra de arriba y las cajas que se piden, en orden. */
const cajas = (page: Page, selectores: readonly string[]) =>
  page.evaluate((sels) => {
    const barra = document.querySelector('sc-top-bar .top-bar')!.getBoundingClientRect().bottom;
    return {
      barra,
      cajas: sels.map((s) => {
        const b = document.querySelector(s)!.getBoundingClientRect();
        return { arriba: b.top, abajo: b.bottom };
      }),
    };
  }, selectores);

/** Los huecos entre la barra y la primera caja, y entre cada caja y la siguiente. */
const huecos = (m: Awaited<ReturnType<typeof cajas>>) =>
  m.cajas.map((c, i) => Math.round((c.arriba - (i === 0 ? m.barra : m.cajas[i - 1]!.abajo)) * 100) / 100);

for (const ruta of LISTAS) {
  test(`${ruta}: barra → título 28, título → buscador 14, buscador → tabla 7`, async ({ page }) => {
    await goto(page, ruta);
    await page.locator('.table-card').waitFor();
    const m = await cajas(page, ['main h1.page__heading', '.page__action-bar', '.table-card']);
    expect(huecos(m)).toEqual([28, 14, 7]);
  });
}

test('plantillas: las pestañas, a 14 del título y a 14 de su buscador', async ({ page }) => {
  await goto(page, 'admin/plantillas');
  await page.locator('.table-card').waitFor();
  const m = await cajas(page, ['main h1.page__heading', 'sc-tabs.tabs', '.page__action-bar', '.table-card']);
  expect(huecos(m)).toEqual([28, 14, 14, 7]);
});

test('conversaciones: el segmentado a 14 del título y de los filtros, y los filtros a 7 de la tabla', async ({ page }) => {
  await goto(page, 'conversaciones');
  await page.locator('.table-card').waitFor();
  const m = await cajas(page, [
    'main h1.page__heading',
    '.memory-conversation-filters__top',
    '.memory-conversation-filters__bar',
    '.table-card',
  ]);
  expect(huecos(m)).toEqual([28, 14, 14, 7]);
});

test('entidades: la sección a 14 del título, y su tabla a 14 de su subtítulo', async ({ page }) => {
  await goto(page, 'conversaciones/entidades');
  await page.locator('.table-card').first().waitFor();
  const m = await cajas(page, ['main h1.page__heading', '.entities-section__head', '.entities-section .table-card']);
  expect(huecos(m)).toEqual([28, 14, 14]);
});

test('las fichas y Contact Center arrancan a 28 de la barra, como las listas', async ({ page }) => {
  for (const ruta of ['admin/agentes/editar/1', 'admin/grupos/editar/11', 'config/aed/servicio']) {
    await goto(page, ruta);
    await page.locator('.page__rail').waitFor();
    const m = await cajas(page, ['.page__rail']);
    expect(huecos(m), ruta).toEqual([28]);
  }
});
