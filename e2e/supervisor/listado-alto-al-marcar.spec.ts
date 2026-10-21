import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * MARCAR UNA CASILLA NO MUEVE EL BORDE DE ABAJO DE LA TABLA, SI NO HAY BARRA DE LOTE.
 *
 * Grupos y Agentes tienen casillas para elegir y exportar, sin edición en lote (DD-215): no montan `sc-bulk-action-bar`.
 * Pero `sc-list-page` ponía `.table-card--seleccion` con solo haber algo marcado, y esa clase reserva el sitio de la
 * barra (`margin-bottom` = 56 + 21 px): con las filas sin caber en la ventana, marcar una fila subía el borde de la
 * tabla 77 px y dejaba debajo un hueco en blanco, sin nada. Medido el 2026-10-21 a 1840 de ancho: a 700, 800 y 900 de
 * alto, 77 px exactos, con `.bulk-bar` ausente; a 1000, donde las filas caben, solo 2,5 px y por eso no se veía.
 *
 * Lo que fija (la fila 4 de «Cómo se comporta: listado de grupos», «Alto: hasta el pie de la ventana, cabecera fija;
 * no encoge al filtrar»):
 *   1. con una, con dos marcadas y al desmarcarlas, el borde de abajo de la tarjeta queda donde estaba;
 *   2. la prueba se hace en una ventana donde las filas NO caben (la tabla desplaza por dentro): si caben, la tarjeta
 *      tiene holgura y el fallo se esconde (a 1000 de alto salía 2,5 px en vez de 77);
 *   3. control en Usuarios, que SÍ monta barra: ahí marcar sube el borde lo que la barra reserva, de diseño (DD-95
 *      regla 3). Sin él, un «no se mueve» podría ser una sonda que no ve nada.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** El borde de abajo de la tarjeta de la tabla, en px de ventana. */
const bordeDeAbajo = (page: Page) =>
  page.locator('.table-card').first().evaluate((tarjeta) => Math.round(tarjeta.getBoundingClientRect().bottom * 2) / 2);

/** Deja que Angular pinte y `scLlegaAlPie` mida (`afterEveryRender`) antes de leer: dos fotogramas. */
const asentar = (page: Page) =>
  page.evaluate(() => new Promise<void>((listo) => requestAnimationFrame(() => requestAnimationFrame(() => listo()))));

const casilla = (page: Page, fila: number) => page.locator('tbody tr').nth(fila).locator('p-table-checkbox');

/** Abre el listado con las filas sin caber: la tabla desplaza por dentro, así que el alto no tiene holgura. */
const abrir = async (page: Page, ruta: string, alto = 800): Promise<void> => {
  await page.setViewportSize({ width: 1840, height: alto });
  await goto(page, ruta);
  await page.locator('tbody tr').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await asentar(page);
  const desplazaPorDentro = await page
    .locator('.table-card')
    .first()
    .evaluate((tarjeta) =>
      [...tarjeta.querySelectorAll('.p-datatable-table-container, .p-virtualscroller')].some((c) => c.scrollHeight > c.clientHeight),
    );
  expect(desplazaPorDentro, 'a este alto las filas caben y la prueba no mediría nada').toBe(true);
};

for (const [nombre, ruta] of [
  ['Grupos', 'admin/grupos'],
  ['Agentes', 'admin/agentes'],
] as const) {
  test(`${nombre}: marcar y desmarcar casillas no mueve el borde de abajo de la tabla`, async ({ page }) => {
    await abrir(page, ruta);
    const sinMarcar = await bordeDeAbajo(page);

    await casilla(page, 2).click();
    await expect(casilla(page, 2).getByRole('checkbox')).toBeChecked();
    await asentar(page);
    expect(await bordeDeAbajo(page), 'con una marcada').toBe(sinMarcar);

    await casilla(page, 3).click();
    await expect(casilla(page, 3).getByRole('checkbox')).toBeChecked();
    await asentar(page);
    expect(await bordeDeAbajo(page), 'con dos marcadas').toBe(sinMarcar);

    // Y no hay barra que justifique mover nada.
    await expect(page.locator('sc-bulk-action-bar .bulk-bar')).toHaveCount(0);

    await casilla(page, 2).click();
    await casilla(page, 3).click();
    await expect(casilla(page, 3).getByRole('checkbox')).not.toBeChecked();
    await asentar(page);
    expect(await bordeDeAbajo(page), 'al desmarcarlas').toBe(sinMarcar);
  });
}

test('Control, Usuarios: con barra de lote, marcar sí sube el borde lo que la barra reserva', async ({ page }) => {
  // Usuarios tiene menos filas que Grupos: a 800 de alto caben, y sin faltar sitio la barra no mueve nada.
  await abrir(page, 'admin/usuarios', 520);
  const sinMarcar = await bordeDeAbajo(page);

  await casilla(page, 2).click();
  await expect(page.locator('sc-bulk-action-bar .bulk-bar')).toBeVisible();
  await asentar(page);
  const barra = await page.locator('sc-bulk-action-bar .bulk-bar').evaluate((el) => el.getBoundingClientRect().height);
  const conBarra = await bordeDeAbajo(page);
  expect(sinMarcar - conBarra, 'lo que sube el borde al aparecer la barra').toBeGreaterThanOrEqual(barra);
});
