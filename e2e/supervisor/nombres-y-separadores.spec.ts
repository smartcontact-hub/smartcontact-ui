import { expect, test } from '@playwright/test';

import { colorEfectivo } from '../shared/color';
import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LO QUE DEJÓ DD-113: UNA TIRA DE PESTAÑAS SIN NOMBRE Y UNA REGLA QUE NO LLEGABA.
 *
 *   - La tira del reproductor de conversación (Transcripción · Análisis) no tenía nombre. Se le pone como en el
 *     Monitor: por `pt` al nodo con `role="tablist"`, porque en el host de `p-tablist` no llega (medido el 2026-09-15).
 *   - La «o» del acceso: su página le pedía el color secundario a `.login__divider`, el host de `sc-divider`, pero
 *     PrimeNG pone el color en `.p-divider-content` y la regla no llegaba. La «o» siempre ha llevado el color del
 *     separador del DS; sale la regla muerta y aquí se fija lo que se ve: ese color, y que se lee (AA).
 */

test.use({ storageState: { cookies: [], origins: [] }, contextOptions: { reducedMotion: 'reduce' } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('el reproductor nombra su tira de pestañas', async ({ page }) => {
  await goto(page, 'conversaciones');
  await page.locator('[data-testid="conversations-table"] .p-datatable-tbody > tr').first().locator('td').nth(3).click();
  // Control: las pestañas están. Sin ellas, buscar la tira por su nombre no diría nada.
  await expect(page.getByRole('tab', { name: 'Transcripción' })).toBeVisible();
  await expect(page.getByRole('tablist', { name: 'Contenido de la conversación' })).toHaveCount(1);
});

test('la «o» del acceso lleva el color del separador del DS y se lee', async ({ page }) => {
  await page.goto('/login');
  const contenido = page.locator('sc-divider.login__divider .p-divider-content');
  const o = contenido.locator('span');
  await expect(o).toBeVisible();

  const delSeparador = await contenido.evaluate((el) => getComputedStyle(el).color);
  expect(await o.evaluate((el) => getComputedStyle(el).color)).toBe(delSeparador);
  expect((await o.evaluate(colorEfectivo)).ratio).toBeGreaterThanOrEqual(4.5);
});
