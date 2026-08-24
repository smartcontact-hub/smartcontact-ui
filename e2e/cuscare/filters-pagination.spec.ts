import { expect, test, type Page } from '@playwright/test';

import { watchTransient } from './helpers';

/**
 * CusCare · filtros y paginación FUNCIONANDO.
 *
 * No basta con que se vean: estos tests comprueban que filtrar reduce las filas,
 * que el múltiple admite varios valores, que paginar cambia el contenido y que
 * el loader del original aparece entre página y página.
 *
 * Los tipos de filtro por columna se midieron en la app real (cuatro distintos:
 * popover, multiselect, select e input), así que aquí se afirma esa forma —
 * si alguien los uniformiza "por limpieza", esto lo caza.
 */

const TICKETS = '/#/private/cuscare/tickets';

async function goto(page: Page) {
  await page.goto(TICKETS);
  await expect(page.locator('.cc-table tbody tr').first()).toBeVisible();
}

const bodyRows = (page: Page) => page.locator('.cc-table tbody tr');

/** Total de resultados del pie ("11–20 of 60 results" → 60). */
async function totalResults(page: Page): Promise<number> {
  const txt = (await page.locator('.tickets__count').innerText()).trim();
  const m = txt.match(/of\s+(\d+)\s+results/);
  if (!m) throw new Error(`No se pudo leer el total del pie: "${txt}"`);
  return Number(m[1]);
}

test.describe('tipos de filtro', () => {
  test('cada columna trae el control que le toca', async ({ page }) => {
    await goto(page);
    const filterRow = page.locator('.cc-table .filterrow');

    // Status y Group son MÚLTIPLES (medido en la real).
    await expect(filterRow.locator('p-multiselect')).toHaveCount(2);
    // Channel · Country · Priority · Sub-status · GDPR son simples.
    await expect(filterRow.locator('p-select')).toHaveCount(5);
    // ID · Assigned to · Products · Refund abren popover.
    await expect(filterRow.locator('.filterbtn')).toHaveCount(4);
    // El resto, input de texto.
    await expect(filterRow.locator('input.filterinput')).toHaveCount(7);
  });

  test('el select y el multiselect muestran el placeholder "—"', async ({ page }) => {
    await goto(page);
    // Es el placeholder del original, no un guion decorativo.
    await expect(page.locator('.cc-table .filterrow .p-placeholder').first()).toHaveText('—');
  });
});

test.describe('los filtros filtran de verdad', () => {
  test('el input de texto reduce el total de resultados', async ({ page }) => {
    await goto(page);
    // Se mide el TOTAL, no las filas visibles: con paginación de 10, filtrar de
    // 60 a 12 deja la página 1 igual de llena y un conteo de filas no vería
    // nada. (Mi primera versión de este test fallaba justo por eso.)
    const before = await totalResults(page);

    // Carrier, no el primer input (que es Source y no contiene "Orange").
    await page.getByLabel('Filtrar por Carrier').fill('Orange');
    const after = await totalResults(page);

    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);
  });

  test('el multiselect admite VARIOS valores y suma resultados', async ({ page }) => {
    await goto(page);

    const status = page.locator('.cc-table .filterrow p-multiselect').first();
    await status.click();
    await page.locator('.p-multiselect-overlay li').first().click();
    const withOne = await bodyRows(page).count();

    await page.locator('.p-multiselect-overlay li').nth(1).click();
    const withTwo = await bodyRows(page).count();

    // Dos valores nunca pueden devolver menos que uno: eso es ser múltiple.
    expect(withTwo).toBeGreaterThanOrEqual(withOne);
    await expect(status.locator('.p-multiselect-chip')).toHaveCount(2);
  });

  test('"Delete filters" NO existe hasta que hay filtro, y al usarlo desaparece', async ({
    page,
  }) => {
    await goto(page);
    const clear = page.getByRole('button', { name: /Delete filters/ });
    // Corregido tras medirlo en la real: no es que arranque DESHABILITADO, es
    // que no está. `.tools-container--right` se queda literalmente sin hijos.
    await expect(clear).toHaveCount(0);

    // Se filtra por Carrier (no por el primer input, que es Source y no
    // contiene "Orange": mi primera versión de este test daba 0 resultados).
    await page.getByLabel('Filtrar por Carrier').fill('Orange');
    await expect(clear).toBeVisible();
    const filtered = await totalResults(page);

    await clear.click();
    await expect(clear).toHaveCount(0);
    expect(await totalResults(page)).toBeGreaterThan(filtered);
  });
});

test.describe('paginación', () => {
  test('clicar una página cambia las filas', async ({ page }) => {
    await goto(page);
    const firstIdPage1 = await bodyRows(page).first().locator('td').nth(1).innerText();

    await page.getByRole('button', { name: 'Página 2', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Página 2', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );

    const firstIdPage2 = await bodyRows(page).first().locator('td').nth(1).innerText();
    expect(firstIdPage2).not.toBe(firstIdPage1);
  });

  /**
   * El loader dura 380 ms: se comprueba con el vigía, no mirando la pantalla.
   *
   * La versión anterior hacía `expect(page.locator('.loadingoverlay')).toBeVisible()`
   * justo tras el clic y era una CARRERA — rojo intermitente con la máquina
   * cargada, verde con la máquina limpia. El porqué, la medición y por qué subir
   * el timeout no arregla nada están en `watchTransient` (`./helpers`).
   */
  test('muestra el loader del original entre páginas', async ({ page }) => {
    await goto(page);
    const loader = await watchTransient(page, '.loadingoverlay');

    await page.getByRole('button', { name: 'Página 3', exact: true }).click();

    // El overlay del original ENTRÓ, y entró con su spinner y su mensaje.
    await expect.poll(async () => (await loader()).seen, { timeout: 5_000 }).toBe(true);
    const seen = await loader();
    expect(seen.text).toContain('Loading data...');
    expect(seen.classes).toContain('spinner');

    // …y se va solo al terminar, dejando la tabla en la página 3. Se afirma con
    // `toHaveCount(0)` y no con `toBeHidden`, que también pasa si el overlay no
    // hubiera existido NUNCA: aquí lo que se quiere decir es que se FUE.
    await expect(page.locator('.loadingoverlay')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Página 3', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  /**
   * La ventana de números SIGUE a la página actual. Medido en las 328 páginas de
   * la app real (y confirmado con 11, para descartar que dependiera del total):
   *   pág ≤ 4 → 1 2 3 4 5 … 328 · pág 5 → 1 … 4 5 6 … 328 · última → 1 … 324…328
   * Antes se pintaba siempre `1 2 3 4 5` y no se movía: al llegar a la 5 el botón
   * activo quedaba en el borde sin forma de avanzar salvo con las flechas.
   */
  test('la ventana de páginas sigue a la página actual', async ({ page }) => {
    await goto(page);
    const numeros = () => page.locator('.pager__btn, .pager__gap');

    await expect(numeros()).toHaveText(['«', '‹', '1', '2', '3', '4', '5', '…', '328', '›', '»']);

    await page.getByRole('button', { name: 'Página 5', exact: true }).click();
    await expect(numeros()).toHaveText(['«', '‹', '1', '…', '4', '5', '6', '…', '328', '›', '»']);

    await page.getByRole('button', { name: 'Última página' }).click();
    await expect(numeros()).toHaveText([
      '«',
      '‹',
      '1',
      '…',
      '324',
      '325',
      '326',
      '327',
      '328',
      '›',
      '»',
    ]);
  });

  test('primera/última se deshabilitan en los extremos', async ({ page }) => {
    await goto(page);
    await expect(page.getByRole('button', { name: 'Primera página' })).toBeDisabled();

    await page.getByRole('button', { name: 'Última página' }).click();
    await expect(page.getByRole('button', { name: 'Última página' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Primera página' })).toBeEnabled();
  });

  test('el contador de resultados acompaña a la página', async ({ page }) => {
    await goto(page);
    await expect(page.locator('.tickets__count')).toContainText('1–10');

    await page.getByRole('button', { name: 'Página 2', exact: true }).click();
    await expect(page.locator('.tickets__count')).toContainText('11–20');
  });

  test('filtrar vuelve a la página 1', async ({ page }) => {
    await goto(page);
    await page.getByRole('button', { name: 'Página 3', exact: true }).click();
    await expect(page.locator('.tickets__count')).toContainText('21–');

    // Se filtra por Carrier (no por el primer input, que es Source y no
    // contiene "Orange": mi primera versión de este test daba 0 resultados).
    await page.getByLabel('Filtrar por Carrier').fill('Orange');
    // Si no reseteara, se quedaría mirando una página que ya no existe.
    await expect(page.locator('.tickets__count')).toContainText('1–');
  });
});
