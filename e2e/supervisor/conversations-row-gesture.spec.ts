import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * El gesto de fila en transcripciones tras la Ola 6 (R1).
 *
 * Esta tabla era la ÚNICA de la casa donde el click de fila no abría: toglaba
 * selección. Aquí se fija el reparto nuevo, que es lo que hace impredecible o
 * predecible la interfaz entera:
 *
 *   fila → abre · celda de la casilla → selecciona (sin abrir) ·
 *   shift+click → rango · Enter → abre · Espacio → selecciona
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

const ROW = '.memory-conversations-table__row';
const CHECKBOX = '.memory-conversations-table__checkbox';
const PLAYER = 'sc-memory-conversation-player-modal .p-dialog';

test('la fila ABRE el reproductor', async ({ page }) => {
  await page.locator(ROW).first().click();
  await expect(page.locator(PLAYER)).toBeVisible();
});

test('la celda de la casilla SELECCIONA sin abrir', async ({ page }) => {
  const row = page.locator(ROW).first();

  // Se clica la CELDA, no la casilla: el objetivo grande es justamente lo que
  // la ola añade, y si sigue abriendo el reproductor, el gesto está roto.
  await row.locator('.memory-conversations-table__td-select').click();

  await expect(page.locator(PLAYER)).toBeHidden();
  await expect(row.locator(CHECKBOX)).toBeChecked();
  // Y la barra masiva aparece: es donde vive ahora la consecuencia (Ola 5).
  await expect(page.locator('sc-bulk-action-bar .bulk-bar')).toBeVisible();
});

test('shift+click selecciona el rango, sin abrir nada', async ({ page }) => {
  const rows = page.locator(ROW);

  await rows.nth(1).locator('.memory-conversations-table__td-select').click();
  await rows.nth(4).locator('.memory-conversations-table__td-select').click({
    modifiers: ['Shift'],
  });

  await expect(page.locator(PLAYER)).toBeHidden();
  for (const i of [1, 2, 3, 4]) {
    await expect(rows.nth(i).locator(CHECKBOX)).toBeChecked();
  }
  // Fuera del rango, intacta.
  await expect(rows.nth(0).locator(CHECKBOX)).not.toBeChecked();
});

test('con el teclado: Enter abre y Espacio selecciona', async ({ page }) => {
  const row = page.locator(ROW).first();

  await row.focus();
  await page.keyboard.press(' ');
  await expect(row.locator(CHECKBOX)).toBeChecked();
  await expect(page.locator(PLAYER)).toBeHidden();

  await page.keyboard.press('Enter');
  await expect(page.locator(PLAYER)).toBeVisible();
});
