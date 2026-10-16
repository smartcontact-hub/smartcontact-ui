import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL RESULTADO DE UN CAMBIO EN LOTE: UN TOAST, Y EN SU BARRA CON «DESHACER» (DD-196, DD-211 §5).
 *
 * Medido el 2026-10-11 en Grupos a 1440: tras aplicar un cambio en lote salía un toast que se iba a los 8 s con su
 * «Deshacer». Desde DD-196 la barra de lote se queda donde estaba y lo cuenta («Cambio aplicado a 2 grupos») con
 * «Deshacer» pegado al texto, sin irse sola, hasta que se cierra o se vuelve a marcar una fila. Desde DD-211 §5, además,
 * lo dice el toast de toda acción, sin botón: el toast se va solo y el deshacer sigue en la barra. Deshacer (o Ctrl+Z)
 * devuelve las filas y deja «Cambio revertido».
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const fila = (page: Page, grupo: string) => page.locator('tbody tr', { hasText: grupo });

/** La celda de una columna por su cabecera (la del nombre es `th`, DD-194). */
const prioridad = async (page: Page, grupo: string) => {
  const i = (await page.locator('thead th').allInnerTexts()).findIndex((t) => t.trim().startsWith('Prioridad'));
  expect(i, 'la columna «Prioridad», a la vista').toBeGreaterThanOrEqual(0);
  return fila(page, grupo).locator('td, th').nth(i);
};

/** Reclamaciones (Alta) y Telemarketing (Baja) pasan a Media desde la barra de lote. */
const aplicarMedia = async (page: Page) => {
  await fila(page, 'Reclamaciones').locator('p-table-checkbox').click();
  await fila(page, 'Telemarketing').locator('p-table-checkbox').click();
  const lote = page.locator('sc-bulk-edit-menu');
  await lote.locator('sc-select').first().click();
  await page.getByRole('option', { name: 'Prioridad', exact: true }).click();
  await lote.locator('sc-select').last().click();
  await page.getByRole('option', { name: 'Media', exact: true }).click();
  await lote.getByRole('button', { name: 'Aplicar' }).click();
  await page.getByRole('dialog', { name: /Aplicar cambio/ }).getByRole('button', { name: 'Aplicar' }).click();
};

test('Grupos · el cambio en lote lo dice un toast y la barra, que se queda con «Deshacer»', async ({ page }) => {
  await page.clock.install();
  await goto(page, 'admin/grupos');
  await expect(await prioridad(page, 'Reclamaciones')).toHaveText('Alta');
  await aplicarMedia(page);

  const barra = page.locator('sc-bulk-action-bar .bulk-bar');
  await expect(barra).toContainText('Cambio aplicado a 2 grupos');
  await expect(await prioridad(page, 'Reclamaciones')).toHaveText('Media');
  const toast = page.locator('.p-toast-message');
  await expect(toast, 'el toast de toda acción').toHaveCount(1);
  await expect(toast).toContainText('Cambio aplicado a 2 grupos');
  await expect(toast.getByRole('button', { name: 'Deshacer' }), 'el deshacer va en la barra, no en el toast').toHaveCount(0);

  // La barra no tapa ninguna fila: la tarjeta de la tabla acaba antes de que empiece.
  const [tarjeta, caja] = [await page.locator('.table-card').boundingBox(), await barra.boundingBox()];
  expect(tarjeta!.y + tarjeta!.height, 'la tabla acaba antes que la barra').toBeLessThanOrEqual(caja!.y);

  // El toast se va solo; la barra sigue con su «Deshacer».
  await page.clock.fastForward(15_000);
  await expect(toast, 'el toast ya se fue').toHaveCount(0);
  const deshacer = barra.getByRole('button', { name: 'Deshacer', exact: true });
  await expect(deshacer).toBeVisible();

  await deshacer.click();
  await expect(await prioridad(page, 'Reclamaciones')).toHaveText('Alta');
  await expect(barra).toContainText('Cambio revertido');
  await expect(deshacer, 'lo deshecho no se vuelve a deshacer').toHaveCount(0);
  await expect(toast, 'también al deshacer').toContainText('Cambio revertido');

  await barra.getByRole('button', { name: 'Cerrar' }).click();
  await expect(barra).toHaveCount(0);
});

test('Grupos · Ctrl+Z deshace el lote, y volver a marcar una fila devuelve la barra a la selección', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await aplicarMedia(page);
  const barra = page.locator('sc-bulk-action-bar .bulk-bar');
  await expect(barra).toContainText('Cambio aplicado a 2 grupos');

  await page.locator('main h1').first().click();
  await page.keyboard.press('Control+z');
  await expect(await prioridad(page, 'Reclamaciones')).toHaveText('Alta');
  await expect(barra).toContainText('Cambio revertido');

  await fila(page, 'Exclusivo').locator('p-table-checkbox').click();
  await expect(barra).toContainText('1/14');
  await expect(barra).not.toContainText('Cambio revertido');
  await expect(barra.getByRole('button', { name: 'Eliminar' })).toBeVisible();
});

test('Usuarios · el resultado dice qué se cambió y a cuántos, en su idioma', async ({ page }) => {
  await goto(page, 'admin/usuarios');
  const filas = page.locator('tbody tr');
  await filas.nth(0).locator('p-table-checkbox').click();
  const lote = page.locator('sc-bulk-edit-menu');
  await lote.locator('sc-select').first().click();
  await page.getByRole('option').first().click();
  await lote.locator('sc-select').last().click();
  await page.getByRole('option').first().click();
  await lote.getByRole('button', { name: 'Aplicar' }).click();
  await page.getByRole('dialog', { name: /Aplicar cambio/ }).getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.locator('sc-bulk-action-bar .bulk-bar')).toContainText('Cambio aplicado a 1 usuario');
});
