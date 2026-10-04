import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * ELEGIR Y ORDENAR COLUMNAS EN UN SOLO CONTROL NATIVO (DD-162).
 *
 * La revisión de producto del 2026-10-04: las columnas se elegían en el selector del icono (el MultiSelect de «Column
 * Toggle») y se ordenaban arrastrando las cabeceras de la tabla (`reorderableColumns`), dos sitios para lo mismo. Se
 * pidió un solo control nativo de PrimeNG y sin arrastrar cabeceras. Es el Listbox con `checkbox` y `dragdrop`, en un
 * globo bajo el mismo icono: el patrón de Airtable y Notion (una lista con su casilla y su asa). Lo que fija, en
 * Agentes:
 *   1. el icono abre una lista con todas las columnas, en el orden de la tabla, cada una con su casilla;
 *   2. desmarcar una la oculta, y volver a marcarla la deja donde estaba;
 *   3. arrastrar una en la lista la mueve en la tabla, y sigue ahí al volver a la página;
 *   4. las cabeceras ya no se arrastran;
 *   5. Nombre sale marcada y fija.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const cabeceras = (page: Page) =>
  page.locator('sc-datatable thead th').evaluateAll((ths) =>
    ths.map((th) => (th.textContent ?? '').trim()).filter((t) => t.length > 0),
  );
const boton = (page: Page) => page.locator('.page__action-bar').getByRole('button', { name: /^Columnas, \d+ de \d+$/ });
const lista = (page: Page) => page.getByRole('listbox', { name: /^Columnas/ });
const opcion = (page: Page, nombre: string) => lista(page).getByRole('option', { name: nombre, exact: true });

test('el icono abre una lista con las columnas en el orden de la tabla, cada una con su casilla', async ({ page }) => {
  await goto(page, 'admin/agentes');
  await expect(boton(page).locator('.sc-icon-font--view_column'), 'el icono de columnas').toHaveCount(1);
  await boton(page).click();
  await expect(lista(page)).toBeVisible();
  await expect(lista(page)).toHaveAttribute('aria-multiselectable', 'true');
  const enLista = await lista(page).getByRole('option').allTextContents();
  const enTabla = await cabeceras(page);
  // Las visibles, en el mismo orden en la lista que en la tabla.
  expect(enLista.map((t) => t.trim()).filter((t) => enTabla.includes(t))).toEqual(enTabla);
  await expect(lista(page).locator('.p-checkbox').first()).toBeVisible();
  await expect(opcion(page, 'Nombre')).toHaveAttribute('aria-selected', 'true');
  await expect(opcion(page, 'Nombre')).toHaveAttribute('aria-disabled', 'true');
});

test('desmarcar una columna la oculta, y volver a marcarla la deja donde estaba', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  await boton(page).click();
  await opcion(page, 'Canales').click();
  await expect.poll(() => cabeceras(page)).not.toContain('Canales');
  await expect(boton(page)).toHaveAccessibleName(new RegExp(`^Columnas, ${antes.length - 1} de `));
  await opcion(page, 'Canales').click();
  await expect.poll(() => cabeceras(page)).toEqual(antes);
});

test('arrastrar una columna en la lista la mueve en la tabla, y se queda al volver', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  const [primera, segunda] = [antes[1]!, antes[2]!];
  await boton(page).click();
  const origen = await opcion(page, segunda).boundingBox();
  const destino = await opcion(page, primera).boundingBox();
  await page.mouse.move(origen!.x + origen!.width / 2, origen!.y + origen!.height / 2);
  await page.mouse.down();
  await page.mouse.move(destino!.x + destino!.width / 2, destino!.y + 2, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => (await cabeceras(page)).slice(1, 3)).toEqual([segunda, primera]);
  await page.reload();
  await expect.poll(async () => (await cabeceras(page)).slice(1, 3)).toEqual([segunda, primera]);
});

test('las cabeceras de la tabla ya no se arrastran', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  // El mismo gesto que movía una cabecera con `reorderableColumns` (la prueba de DD-153): agarrar por el texto.
  await page
    .locator('sc-datatable thead th[data-field="channels"] .sc-datatable__header-label')
    .dragTo(page.locator('sc-datatable thead th[data-field="extension"]'));
  await page.waitForTimeout(300);
  expect(await cabeceras(page)).toEqual(antes);
});
