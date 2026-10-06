import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * ELEGIR Y ORDENAR COLUMNAS: EL «COLUMN TOGGLE» DE PRIMENG.DEV, TAL CUAL (DD-176, que sustituye el Listbox de DD-162).
 *
 * primeng.dev/table, «Column Toggle»: un botón «Columns» con su engranaje (outlined, secondary, small) que abre un
 * Popover de 18rem sin relleno; arriba, el título y «Reset» (texto, secondary, small); debajo, una fila por columna con
 * su asa, su casilla (`p-checkbox`) y su nombre, que se arrastra para ordenar (`cdkDrag`). Medido en primeng.dev el
 * 2026-10-05: botón de 28 de alto, globo de 288, cabecera de 53 con raya abajo, filas de 32. Lo que fija, en Agentes:
 *   1. el botón dice «Columnas» y abre su globo: el título, «Restablecer» y una fila por columna, en el orden de la tabla,
 *      cada una con su asa y su casilla; Nombre, marcada y fija;
 *   2. desmarcar una la oculta, y volver a marcarla la deja donde estaba;
 *   3. arrastrar una fila mueve la columna en la tabla, y sigue ahí al volver a la página;
 *   4. «Restablecer» vuelve al orden y a las columnas de partida;
 *   5. las cabeceras de la tabla no se arrastran;
 *   6. con el teclado y sin arrastrar (WCAG 2.1.1 y 2.5.7, lo que el ejemplo no trae y DD-162 ya pedía): al abrir, el
 *      foco entra en la lista; las flechas van de una columna a otra, Espacio la marca o desmarca, «Subir» y «Bajar»
 *      mueven la enfocada, y Escape vuelve al botón.
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
const globo = (page: Page) => page.getByRole('dialog', { name: 'Columnas' });
const filas = (page: Page) => globo(page).locator('.column-toggle__row');
const casilla = (page: Page, nombre: string) => globo(page).getByRole('checkbox', { name: nombre, exact: true });
const enfocada = (page: Page) =>
  page.evaluate(
    () => document.activeElement?.closest('.column-toggle__row')?.querySelector('.column-toggle__label')?.textContent?.trim() ?? null,
  );

test('el botón «Columnas» dice en el foco que abre un diálogo, y si ya está abierto (DD-171)', async ({ page }) => {
  await goto(page, 'admin/agentes');
  await expect(boton(page)).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(boton(page)).toHaveAttribute('aria-expanded', 'false');
  await boton(page).click();
  await expect(globo(page)).toBeVisible();
  await expect(boton(page)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(globo(page)).toBeHidden();
  await expect(boton(page)).toHaveAttribute('aria-expanded', 'false');
});

test('el botón «Columnas» abre su globo: título, «Restablecer» y una fila por columna, con su asa y su casilla', async ({ page }) => {
  await goto(page, 'admin/agentes');
  await expect(boton(page)).toContainText('Columnas');
  await expect(boton(page).locator('.sc-icon-font--settings'), 'el engranaje del ejemplo').toHaveCount(1);
  await boton(page).click();
  await expect(globo(page)).toBeVisible();
  await expect(globo(page).locator('.column-toggle__title')).toHaveText('Columnas');
  await expect(globo(page).getByRole('button', { name: 'Restablecer' })).toBeVisible();
  const enGlobo = (await filas(page).locator('.column-toggle__label').allTextContents()).map((t) => t.trim());
  const enTabla = await cabeceras(page);
  expect(enGlobo.filter((t) => enTabla.includes(t)), 'las visibles, en el orden de la tabla').toEqual(enTabla);
  await expect(filas(page).first().locator('.column-toggle__handle'), 'el asa').toHaveCount(1);
  await expect(globo(page).locator('p-checkbox').first(), 'la casilla nativa').toBeVisible();
  await expect(casilla(page, 'Nombre')).toBeChecked();
  await expect(casilla(page, 'Nombre')).toBeDisabled();
});

test('desmarcar una columna la oculta, y volver a marcarla la deja donde estaba', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  await boton(page).click();
  await casilla(page, 'Canales').click();
  await expect.poll(() => cabeceras(page)).not.toContain('Canales');
  await expect(boton(page)).toHaveAccessibleName(new RegExp(`^Columnas, ${antes.length - 1} de `));
  await casilla(page, 'Canales').click();
  await expect.poll(() => cabeceras(page)).toEqual(antes);
});

test('arrastrar una fila mueve la columna en la tabla, y se queda al volver', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  const [primera, segunda] = [antes[1]!, antes[2]!];
  await boton(page).click();
  const fila = (nombre: string) => filas(page).filter({ has: page.locator('.column-toggle__label', { hasText: new RegExp(`^${nombre}$`) }) });
  const origen = await fila(segunda).locator('.column-toggle__handle').boundingBox();
  const destino = await fila(primera).boundingBox();
  await page.mouse.move(origen!.x + origen!.width / 2, origen!.y + origen!.height / 2);
  await page.mouse.down();
  await page.mouse.move(destino!.x + destino!.width / 2, destino!.y + 2, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => (await cabeceras(page)).slice(1, 3)).toEqual([segunda, primera]);
  await page.reload();
  await expect.poll(async () => (await cabeceras(page)).slice(1, 3)).toEqual([segunda, primera]);
});

test('«Restablecer» vuelve al orden y a las columnas de partida', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  await boton(page).click();
  await casilla(page, 'Canales').click();
  await expect.poll(() => cabeceras(page)).not.toContain('Canales');
  await globo(page).getByRole('button', { name: 'Restablecer' }).click();
  await expect.poll(() => cabeceras(page)).toEqual(antes);
});

test('las cabeceras de la tabla no se arrastran', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  await page
    .locator('sc-datatable thead th[data-field="channels"] .sc-datatable__header-label')
    .dragTo(page.locator('sc-datatable thead th[data-field="extension"]'));
  await page.waitForTimeout(300);
  expect(await cabeceras(page)).toEqual(antes);
});

test('con el teclado y sin arrastrar: las flechas recorren, Espacio marca, «Subir» y «Bajar» mueven y Escape vuelve', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  const i = antes.indexOf('Email');
  expect(i, 'Email se ve y tiene una movible delante').toBeGreaterThan(1);
  const anterior = antes[i - 1]!;

  await boton(page).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => enfocada(page), 'al abrir, el foco entra en la lista').not.toBeNull();
  for (let n = 0; n < 12 && (await enfocada(page)) !== 'Email'; n++) await page.keyboard.press('ArrowDown');
  expect(await enfocada(page)).toBe('Email');
  // Espacio la desmarca y la vuelve a marcar: la casilla nativa.
  await page.keyboard.press('Space');
  await expect.poll(() => cabeceras(page)).not.toContain('Email');
  await page.keyboard.press('Space');
  await expect.poll(() => cabeceras(page)).toEqual(antes);

  // La lista es una sola parada del tabulador: de ella, a «Subir».
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Subir Email', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await cabeceras(page)).slice(i - 1, i + 1)).toEqual(['Email', anterior]);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Bajar Email', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => cabeceras(page)).toEqual(antes);

  await page.keyboard.press('Escape');
  await expect(globo(page)).toBeHidden();
  await expect(boton(page), 'Escape vuelve al botón').toBeFocused();
});
