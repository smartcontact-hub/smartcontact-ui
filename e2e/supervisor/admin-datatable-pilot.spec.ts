import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * El piloto de B4: labels y plantillas sobre `sc-datatable`.
 *
 * Las dos páginas se migraron de una `<table>` a mano al componente del DS, y
 * hasta ahora NO tenían ni un test — la suite del supervisor no las tocaba.
 * Migrar dos pantallas sin red es como se cuela lo sutil, así que la red va en
 * el mismo lote que la migración, no después.
 *
 * Lo que fija no es el marcado —eso cambia con cada refactor— sino lo que el
 * usuario puede hacer: seleccionar, seleccionar todo, abrir el menú por las
 * dos vías, editar en la fila y quedarse sin resultados al buscar.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const MENU_ITEM = '.p-menu-overlay .p-menu-item-link';
const TABLE = '[data-testid="labels-table"]';

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
  await goto(page, 'admin/labels');
});

test('la tabla la pinta sc-datatable y conserva sus columnas', async ({ page }) => {
  const table = page.locator(TABLE);
  await expect(table).toBeVisible();

  // La <table> a mano ya no existe en ninguna parte de la página.
  await expect(page.locator('table.table')).toHaveCount(0);

  // Casilla + Nombre + Descripción + acciones.
  await expect(table.locator('.p-datatable-thead th')).toHaveCount(4);
  await expect(table.locator('.p-datatable-thead')).toContainText('Nombre');
  await expect(table.locator('.p-datatable-thead')).toContainText('Descripción');

  // Las celdas son composiciones de la página vía cellTemplate: el chip de
  // color se pinta, no el valor crudo del campo.
  await expect(table.locator('.p-datatable-tbody sc-label-chip').first()).toBeVisible();

  // La banda de `caption` de PrimeNG no debe dejar una franja vacía arriba.
  const header = table.locator('.p-datatable-header');
  if (await header.count()) {
    await expect(header).toBeHidden();
  }
});

test('la casilla selecciona y saca la barra de acciones masivas', async ({ page }) => {
  const table = page.locator(TABLE);
  const bulkBar = page.locator('sc-bulk-action-bar');

  await expect(bulkBar).toBeHidden();

  await table.locator('.p-datatable-tbody > tr').first().locator('p-tablecheckbox').click();
  await expect(bulkBar).toBeVisible();
  await expect(bulkBar).toContainText('1');

  await table.locator('.p-datatable-tbody > tr').nth(1).locator('p-tablecheckbox').click();
  await expect(bulkBar).toContainText('2');
});

test('la casilla de cabecera marca todo lo FILTRADO, no todo', async ({ page }) => {
  const table = page.locator(TABLE);
  const rows = table.locator('.p-datatable-tbody > tr');
  const total = await rows.count();

  // Filtrar primero: con la búsqueda puesta, "todo" son solo los resultados.
  await page.locator('sc-search input').fill('orange');
  await expect(rows).toHaveCount(2);

  await table.locator('.p-datatable-thead p-tableheadercheckbox').click();
  await expect(page.locator('sc-bulk-action-bar')).toContainText('2');
  expect(total).toBeGreaterThan(2);
});

test('el kebab y el click derecho abren el MISMO menú (R3)', async ({ page }) => {
  const firstRow = page.locator(`${TABLE} .p-datatable-tbody > tr`).first();

  await firstRow.locator('.rules-kebab-btn').click();
  const items = page.locator(MENU_ITEM);
  await expect(items).toHaveText([/editar/i, /eliminar/i]);

  await page.keyboard.press('Escape');
  await expect(items.first()).toBeHidden();

  // El click derecho sobre la fila abre el mismo modelo — y el navegador no
  // enseña su propio menú porque el DS hace el preventDefault.
  await firstRow.locator('td').nth(1).click({ button: 'right' });
  await expect(page.locator(MENU_ITEM)).toHaveText([/editar/i, /eliminar/i]);
});

test('editar desde el menú ancla el panel a SU fila', async ({ page }) => {
  const rows = page.locator(`${TABLE} .p-datatable-tbody > tr`);
  const secondRow = rows.nth(1);

  await secondRow.locator('.rules-kebab-btn').click();
  await page.locator(MENU_ITEM).filter({ hasText: /editar/i }).click();

  const panel = page.locator('sc-label-form-panel');
  await expect(panel).toBeVisible();

  /* El panel está posicionado contra su CELDA (`position: relative` en el td,
   * que ahora pinta el DS). Si ese bloque contenedor se perdiera, el panel se
   * anclaría al viewport y aparecería lejos de la fila: por eso se comprueba
   * la distancia real, no solo que sea visible. */
  const rowBox = (await secondRow.boundingBox())!;
  const panelBox = (await panel.boundingBox())!;
  expect(panelBox.y).toBeGreaterThan(rowBox.y);
  expect(panelBox.y - (rowBox.y + rowBox.height)).toBeLessThan(40);
});

test('una búsqueda sin resultados enseña el vacío proyectado, no una tabla pelada', async ({
  page,
}) => {
  const table = page.locator(TABLE);

  await page.locator('sc-search input').fill('zzzz-no-existe');
  await expect(table.locator('.p-datatable-tbody > tr')).toHaveCount(1);
  await expect(table.locator('.table__no-results')).toBeVisible();
  await expect(table.locator('.table__no-results-title')).toBeVisible();
});

/* ─────────────────────────── plantillas ─────────────────────────── */

const TPL_TABLE = '[data-testid="templates-table"]';

test.describe('plantillas', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, 'admin/plantillas');
  });

  test('la tabla es del DS y conserva sus cinco columnas', async ({ page }) => {
    const table = page.locator(TPL_TABLE);
    await expect(table).toBeVisible();
    await expect(page.locator('table.table')).toHaveCount(0);

    // Casilla + Título + Contenido + Actualizada + acciones.
    await expect(table.locator('.p-datatable-thead th')).toHaveCount(5);

    /* El cuerpo se recorta a una línea. Es lo que impide que una plantilla
     * larga rompa el alto de la fila, y depende de que el `<span>` proyectado
     * conserve su CSS encapsulado ahora que el `<td>` lo pinta el DS. */
    const bodyText = table.locator('.table__body-text').first();
    await expect(bodyText).toHaveCSS('white-space', 'nowrap');
    await expect(bodyText).toHaveCSS('overflow', 'hidden');
  });

  test('la pestaña filtra y la selección no se arrastra entre pestañas', async ({ page }) => {
    const table = page.locator(TPL_TABLE);
    const rows = table.locator('.p-datatable-tbody > tr');

    await rows.first().locator('p-tablecheckbox').click();
    await expect(page.locator('sc-bulk-action-bar')).toContainText('1');

    // Cambiar de pestaña limpia la selección: lo seleccionado ya no está
    // en pantalla, y una barra masiva que actúa sobre filas invisibles es
    // exactamente el tipo de sorpresa que no debe poder ocurrir.
    await page.locator('.tabs__tab', { hasText: /email/i }).click();
    await expect(page.locator('sc-bulk-action-bar')).toBeHidden();
  });

  test('el kebab y el click derecho abren el mismo menú', async ({ page }) => {
    const firstRow = page.locator(`${TPL_TABLE} .p-datatable-tbody > tr`).first();

    await firstRow.locator('.rules-kebab-btn').click();
    await expect(page.locator(MENU_ITEM).first()).toBeVisible();
    const viaKebab = await page.locator(MENU_ITEM).allTextContents();

    await page.keyboard.press('Escape');
    await expect(page.locator(MENU_ITEM).first()).toBeHidden();

    await firstRow.locator('td').nth(1).click({ button: 'right' });
    await expect(page.locator(MENU_ITEM).first()).toBeVisible();
    expect(await page.locator(MENU_ITEM).allTextContents()).toEqual(viaKebab);
  });
});
