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
    await page.getByLabel('Filter by Carrier').fill('Orange');
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
    await page.getByLabel('Filter by Carrier').fill('Orange');
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

    await page.getByRole('button', { name: 'Page 2', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Page 2', exact: true })).toHaveAttribute(
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

    await page.getByRole('button', { name: 'Page 3', exact: true }).click();

    // El overlay del original ENTRÓ, y entró con su spinner y su mensaje.
    await expect.poll(async () => (await loader()).seen, { timeout: 5_000 }).toBe(true);
    const seen = await loader();
    expect(seen.text).toContain('Loading data...');
    expect(seen.classes).toContain('spinner');

    // …y se va solo al terminar, dejando la tabla en la página 3. Se afirma con
    // `toHaveCount(0)` y no con `toBeHidden`, que también pasa si el overlay no
    // hubiera existido NUNCA: aquí lo que se quiere decir es que se FUE.
    await expect(page.locator('.loadingoverlay')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Page 3', exact: true })).toHaveAttribute(
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

    await page.getByRole('button', { name: 'Page 5', exact: true }).click();
    await expect(numeros()).toHaveText(['«', '‹', '1', '…', '4', '5', '6', '…', '328', '›', '»']);

    await page.getByRole('button', { name: 'Last page' }).click();
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
    await expect(page.getByRole('button', { name: 'First page' })).toBeDisabled();

    await page.getByRole('button', { name: 'Last page' }).click();
    await expect(page.getByRole('button', { name: 'Last page' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'First page' })).toBeEnabled();
  });

  test('el contador de resultados acompaña a la página', async ({ page }) => {
    await goto(page);
    await expect(page.locator('.tickets__count')).toContainText('1–10');

    await page.getByRole('button', { name: 'Page 2', exact: true }).click();
    await expect(page.locator('.tickets__count')).toContainText('11–20');
  });

  test('filtrar vuelve a la página 1', async ({ page }) => {
    await goto(page);
    await page.getByRole('button', { name: 'Page 3', exact: true }).click();
    await expect(page.locator('.tickets__count')).toContainText('21–');

    // Se filtra por Carrier (no por el primer input, que es Source y no
    // contiene "Orange": mi primera versión de este test daba 0 resultados).
    await page.getByLabel('Filter by Carrier').fill('Orange');
    // Si no reseteara, se quedaría mirando una página que ya no existe.
    await expect(page.locator('.tickets__count')).toContainText('1–');
  });
});

/**
 * Ordenación por cabecera.
 *
 * Lo que se afirma no es "ordena", es lo que puede salir MAL en una tabla que
 * pagina sobre 3280 filas en memoria:
 *   · que ordene el conjunto entero y no las 10 filas de la página (el fallo que
 *     produciría `pSortableColumn` de PrimeNG, que solo ve `[value]`);
 *   · que ordene por VALOR y no por texto (fechas `dd-MM-yyyy` y ids numéricos);
 *   · que solo ordenen las SIETE columnas del original;
 *   · que el tercer clic deshaga el orden, como su `cycleColumnSort`.
 */
test.describe('ordenación por cabecera', () => {
  const th = (page: Page, header: string) =>
    page.locator('.cc-table thead tr').first().locator('th').filter({ hasText: header }).first();

  const firstCell = (page: Page, nth: number) =>
    bodyRows(page).first().locator('td').nth(nth);

  test('solo las siete columnas del original ofrecen orden', async ({ page }) => {
    await goto(page);
    const sortables = page.locator('.cc-table thead th.is-sortable');
    await expect(sortables).toHaveCount(7);
    await expect(sortables).toHaveText([
      /ID/,
      /Status/,
      /Assigned to/,
      /Group/,
      /Created/,
      /Updated/,
      /Priority/,
    ]);
    // Y las demás siguen mudas: sin aria-sort no hay promesa de orden.
    await expect(th(page, 'Carrier')).not.toHaveAttribute('aria-sort', /.*/);
  });

  test('el ciclo es asc → desc → sin orden, como en el original', async ({ page }) => {
    await goto(page);
    const id = th(page, 'ID');
    await expect(id).toHaveAttribute('aria-sort', 'none');

    await id.click();
    await expect(id).toHaveAttribute('aria-sort', 'ascending');
    await id.click();
    await expect(id).toHaveAttribute('aria-sort', 'descending');
    await id.click();
    await expect(id).toHaveAttribute('aria-sort', 'none');
  });

  /*
   * OJO al escribir estos tests: leer el DOM de una tirada JUSTO tras el clic es
   * una carrera. `getAttribute`/`innerText` son lecturas de una sola pasada, sin
   * reintento, y Angular puede no haber pintado todavía; las de `expect(...)`
   * SONDEAN hasta que se cumplen. Medido el 2026-08-30: con lectura directa,
   * 5 de 6 intentos leían el estado anterior y parecía que el primer clic se
   * perdía; con `expect`, 6 de 6 correctos. La tabla estaba bien desde el
   * principio — lo que fallaba era el instrumento.
   */
  test('ordena las 3280 filas, no las diez de la página', async ({ page }) => {
    await goto(page);
    const total = await totalResults(page);
    expect(total).toBeGreaterThan(100); // si no, este test no probaría nada

    const id = th(page, 'ID');
    const primerId = firstCell(page, 1);

    // Ascendente: arriba queda el menor de TODA la tabla, no el de la página.
    await id.click();
    await expect(id).toHaveAttribute('aria-sort', 'ascending');
    const asc = Number((await primerId.innerText()).trim());

    await id.click();
    await expect(id).toHaveAttribute('aria-sort', 'descending');
    const desc = Number((await primerId.innerText()).trim());
    expect(desc).toBeGreaterThan(asc);

    // Y la diferencia tiene que ser de TABLA, no de página: entre el menor y el
    // mayor hay más ids de los que caben en una página de diez.
    expect(desc - asc).toBeGreaterThan(10);

    // Deshecho el orden, el primero vuelve a ser el natural.
    await id.click();
    await expect(id).toHaveAttribute('aria-sort', 'none');
    const natural = Number((await primerId.innerText()).trim());
    expect([asc, desc]).toContain(natural); // el seed viene ordenado por id
  });

  test('las fechas ordenan por fecha, no por su texto', async ({ page }) => {
    await goto(page);
    const created = th(page, 'Created');
    await created.click();
    await expect(created).toHaveAttribute('aria-sort', 'ascending');

    // La columna se localiza por su POSICIÓN en la cabecera, no por el aspecto
    // del texto: casar celdas con una expresión regular las escogía por lo que
    // se quiere demostrar, y un cambio de formato dejaría el test verde y ciego.
    const headers = await page.locator('.cc-table thead tr').first().locator('th').allInnerTexts();
    const iCreated = headers.findIndex((h) => h.trim().startsWith('Created'));
    expect(iCreated).toBeGreaterThan(0); // guard: la columna existe

    const textos = await bodyRows(page).evaluateAll(
      (rows, i) => rows.map((r) => (r.querySelectorAll('td')[i] as HTMLElement).innerText.trim()),
      iCreated,
    );
    expect(textos.length).toBeGreaterThan(1);

    // `dd-MM-yyyy HH:mm`: comparado como TEXTO, el día mandaría sobre el mes y
    // «02-12-2025» quedaría por delante de «11-08-2026».
    const aMs = (s: string) => {
      const m = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/.exec(s);
      if (!m) throw new Error(`Formato de fecha inesperado: "${s}"`);
      return Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]);
    };
    const fechas = textos.map(aMs);
    expect(fechas).toEqual([...fechas].sort((a, b) => a - b));

    // Que no salga verde por casualidad. Un orden por TEXTO agrupa por día: con
    // 3280 filas repartidas por meses, la primera página serían diez fechas que
    // empiezan por «01-». Si aquí hay días distintos, no se ordenó por texto.
    const dias = new Set(textos.map((t) => t.slice(0, 2)));
    expect(dias.size).toBeGreaterThan(1);
  });

  test('ordenar devuelve a la página 1', async ({ page }) => {
    await goto(page);
    await page.getByRole('button', { name: 'Page 3', exact: true }).click();
    await expect(page.locator('.tickets__count')).toContainText('21–30');

    await th(page, 'Priority').click();
    await expect(page.locator('.tickets__count')).toContainText('1–10');
  });
});
