import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * CONVERSACIONES SE MONTA SOBRE `sc-list-page`, COMO LAS DEMÁS LISTAS (DD-98).
 *
 * Era la única lista con su tabla propia (`conversation-table`), y por eso se apartaba de la red de comportamiento de
 * las demás: no ordenaba por cabecera y Escape no vaciaba su buscador. Las dos primeras pruebas lo piden; las demás
 * fijan lo suyo, que la pieza tiene que respetar al montarla: el menú del clic derecho depende del estado de la fila y
 * no sale si no tiene acciones, no hay columna «⋮» (decisión de producto del 2026-09-13) y las casillas dicen qué
 * seleccionan. El gesto de fila (abrir, casilla, tramo, Espacio) lo fija `conversations-row-gesture.spec.ts`, y la
 * cadena de altos, `conversations-table-scroll.spec.ts`.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const TABLA = '[data-testid="conversations-table"]';
const FILAS = `${TABLA} .p-datatable-tbody > tr`;

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
  await goto(page, 'conversaciones');
  await expect(page.locator(FILAS).first()).toBeVisible();
});

/** Los valores de una columna, por el texto de su cabecera, en el orden en que se ven. */
const columna = async (page: Page, cabecera: string): Promise<string[]> => {
  const cabeceras = await page.locator(`${TABLA} thead th`).allInnerTexts();
  const i = cabeceras.findIndex((t) => t.trim() === cabecera);
  expect(i, `no hay columna «${cabecera}»: ${cabeceras.join(' | ')}`).toBeGreaterThanOrEqual(0);
  return page.locator(FILAS).evaluateAll((trs, n) => trs.map((tr) => tr.children[n]?.textContent?.trim() ?? ''), i);
};
const fila = (page: Page, id: string) => page.locator(FILAS).filter({ hasText: id });

test('ordena por la cabecera, como las demás listas: «T. Conv.» de menos a más y, al repetir, al revés', async ({ page }) => {
  const antes = await columna(page, 'T. Conv.');
  const subiendo = [...antes].sort();
  // Control: de partida no está ya ordenada, o el clic no demostraría nada.
  expect(antes).not.toEqual(subiendo);

  const cabecera = page.locator(`${TABLA} thead th`).filter({ hasText: 'T. Conv.' });
  await cabecera.click();
  await expect.poll(() => columna(page, 'T. Conv.')).toEqual(subiendo);
  await cabecera.click();
  await expect.poll(() => columna(page, 'T. Conv.')).toEqual([...subiendo].reverse());
});

test('Escape vacía el buscador y, vacío, lo suelta', async ({ page }) => {
  const buscador = page.getByRole('searchbox').first();
  await buscador.fill('zzz');
  await buscador.press('Escape');
  await expect(buscador).toHaveValue('');
  await expect(buscador).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(buscador).not.toBeFocused();
});

test('el clic derecho abre las acciones de la fila, y en una sin acciones no abre nada', async ({ page }) => {
  // VC8201LMA no tiene transcripción: se puede procesar.
  await fila(page, 'VC8201LMA').locator('td').nth(3).click({ button: 'right' });
  await expect(page.getByRole('menuitem', { name: 'Procesar' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);

  // FED1027FEB ya está transcrita y analizada: un menú vacío es peor que ninguno.
  await fila(page, 'FED1027FEB').locator('td').nth(3).click({ button: 'right' });
  await expect(page.getByRole('menu')).toHaveCount(0);
});

test('sin columna «⋮»: cada acción tiene otra puerta (la barra de selección, el reproductor y el clic derecho)', async ({
  page,
}) => {
  await expect(page.locator(TABLA).getByRole('button', { name: 'Más acciones' })).toHaveCount(0);
});

test('las casillas dicen qué seleccionan: la conversación, y todas las filtradas', async ({ page }) => {
  await expect(page.getByRole('checkbox', { name: 'Seleccionar conversación VC8201LMA' })).toHaveCount(1);
  await expect(page.getByRole('checkbox', { name: 'Seleccionar todas las conversaciones filtradas' })).toHaveCount(1);
});
