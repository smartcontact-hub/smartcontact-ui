import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * El gesto de fila en transcripciones tras la Ola 6 (R1).
 *
 * Esta tabla era la ÚNICA de la casa donde el click de fila no abría: toglaba
 * selección. Aquí se fija el reparto nuevo, que es lo que hace impredecible o
 * predecible la interfaz entera:
 *
 *   fila → abre · casilla → selecciona (sin abrir) ·
 *   shift+click en la casilla → rango · Enter → abre · Espacio → selecciona
 *
 * MIGRACIÓN a `sc-datatable`: los SELECTORES cambian porque el `<td>` y la
 * casilla los pinta ahora el DS (`.sc-datatable__check`, `p-tablecheckbox`, y la
 * fila seleccionada lleva `.p-datatable-row-selected`), pero las AFIRMACIONES
 * son las mismas — reescribir un test para que "case con el markup" es cómo se
 * debilita sin querer. Un cambio real y consciente: el objetivo del toggle es la
 * casilla, como en las otras nueve tablas (antes era la celda entera). Lo
 * CRÍTICO de la Ola 6 —que fallar ese objetivo no ABRA el reproductor— se
 * conserva, y se comprueba abajo de forma explícita.
 *
 * Ojo al mantenerlo: las teclas se mandan con `page.keyboard` de Playwright.
 * La acción `key` del navegador entrega los eventos con `key`/`code` vacíos y
 * este test pasaría a mentir (LEARNINGS #1).
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
  await goto(page, 'conversaciones');
});

const TABLE = '[data-testid="conversations-table"]';
const ROW = `${TABLE} .p-datatable-tbody > tr`;
const CHECK_CELL = '.sc-datatable__check';
const CHECKBOX = 'p-tablecheckbox';
/* La fila seleccionada se reconoce por `is-selected`, que la pinta
 * `[rowStyleClass]` leyendo el `Set` de selección de la página —la fuente de
 * verdad, la que usa la barra masiva—. NO por `.p-datatable-row-selected` de
 * p-table: esa clase no se re-pinta al instante en las filas que un rango añade
 * por el input (solo en las que togla p-table), así que afirmar sobre ella daría
 * un falso rojo en el rango aunque la selección sea correcta. Ver el comentario
 * de `onSelectionChange` en `sc-datatable`. */
const SELECTED = /is-selected/;
const PLAYER = 'sc-memory-conversation-player-modal .p-dialog';
const BULK = 'sc-bulk-action-bar .bulk-bar';

test('la fila ABRE el reproductor', async ({ page }) => {
  // Una celda de datos (la fecha), no la de la casilla: esa corta la
  // propagación a propósito y no abre.
  await page.locator(ROW).first().locator('td').nth(3).click();
  await expect(page.locator(PLAYER)).toBeVisible();
});

test('la casilla SELECCIONA sin abrir; el hueco de su celda no abre nada', async ({ page }) => {
  const row = page.locator(ROW).first();

  await row.locator(CHECKBOX).click();

  await expect(page.locator(PLAYER)).toBeHidden();
  await expect(row).toHaveClass(SELECTED);
  // Y la barra masiva aparece: es donde vive ahora la consecuencia (Ola 5).
  await expect(page.locator(BULK)).toBeVisible();

  // La propiedad crítica de la Ola 6: clicar en el HUECO de la celda —no la
  // casilla— no abre el reproductor. El DS corta ahí la propagación, así que
  // fallar el objetivo es un no-op, nunca un modal encima.
  await row.locator(CHECK_CELL).click({ position: { x: 3, y: 3 } });
  await expect(page.locator(PLAYER)).toBeHidden();
});

test('shift+click selecciona el rango, sin abrir nada', async ({ page }) => {
  const rows = page.locator(ROW);

  await rows.nth(1).locator(CHECKBOX).click();
  await rows.nth(4).locator(CHECKBOX).click({ modifiers: ['Shift'] });

  await expect(page.locator(PLAYER)).toBeHidden();
  for (const i of [1, 2, 3, 4]) {
    await expect(rows.nth(i)).toHaveClass(SELECTED);
  }
  // Fuera del rango, intacta.
  await expect(rows.nth(0)).not.toHaveClass(SELECTED);
});

/**
 * El coste del error de memoria muscular.
 *
 * Quien ya usaba esta pantalla clicaba filas para SELECCIONAR. Tras la Ola 6
 * ese mismo gesto abre el reproductor. Ese error va a ocurrir, así que lo que
 * importa no es evitarlo sino que sea BARATO: que no se lleve por delante la
 * selección que el usuario llevaba construida.
 */
test('el error de dedo no destruye la selección', async ({ page }) => {
  const rows = page.locator(ROW);

  // El usuario lleva 3 filas seleccionadas con el gesto nuevo.
  for (const i of [0, 1, 2]) {
    await rows.nth(i).locator(CHECKBOX).click();
  }
  await expect(page.locator(BULK)).toContainText('3');

  // Y ahora clica una fila con el dedo viejo, esperando seleccionar la cuarta.
  await rows.nth(3).locator('td').nth(3).click();
  await expect(page.locator(PLAYER)).toBeVisible();

  // Sale del paso. La selección debe seguir INTACTA: perderla convertiría un
  // gesto equivocado en trabajo perdido.
  await page.keyboard.press('Escape');
  await expect(page.locator(PLAYER)).toBeHidden();

  for (const i of [0, 1, 2]) {
    await expect(rows.nth(i)).toHaveClass(SELECTED);
  }
  await expect(page.locator(BULK)).toContainText('3');
});

test('con el teclado: Enter abre y Espacio selecciona', async ({ page }) => {
  const row = page.locator(ROW).first();

  await row.focus();
  await page.keyboard.press(' ');
  await expect(row).toHaveClass(SELECTED);
  await expect(page.locator(PLAYER)).toBeHidden();

  await page.keyboard.press('Enter');
  await expect(page.locator(PLAYER)).toBeVisible();
});
