import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * Journey del modal de categorías: crear + validación de nombre duplicado.
 *
 * Es el modal donde se pilotó `sc-button` (commit 1c8e350), así que esta suite
 * es también la red de esa migración: si un botón migrado deja de disparar su
 * acción, aquí se cae.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('crear una categoría la añade al listado', async ({ page }) => {
  await goto(page, 'conversaciones/categorias');

  const before = await page.locator('tbody tr').count();
  await page.getByRole('button', { name: /nueva categoría/i }).click();

  const name = `E2E Categoría ${Date.now()}`;
  await page.locator('sc-memory-category-form-modal sc-inputtext input').first().fill(name);
  await page
    .locator('#cat-description')
    .fill('Categoría creada por el e2e para verificar el guardado de punta a punta.');

  await page.getByRole('button', { name: /^(crear|guardar)/i }).click();

  // El componente modal vive siempre en el DOM (`[visible]` gobierna el diálogo):
  // lo que debe desaparecer es el diálogo, no el elemento.
  await expect(page.locator('sc-memory-category-form-modal .p-dialog')).toHaveCount(0);
  await expect(page.locator('tbody tr')).toHaveCount(before + 1);
  await expect(page.locator('tbody tr', { hasText: name })).toHaveCount(1);
});

test('un nombre duplicado bloquea el guardado y lo explica', async ({ page }) => {
  await goto(page, 'conversaciones/categorias');

  const existing = (await page.locator('tbody tr td').first().innerText()).split('·')[0].trim();

  await page.getByRole('button', { name: /nueva categoría/i }).click();
  const modal = page.locator('sc-memory-category-form-modal');
  await modal.locator('sc-inputtext input').first().fill(existing);
  await page.locator('#cat-description').fill('Descripción suficientemente larga para el mínimo.');

  // Error visible + guardar deshabilitado (la validación es real, no cosmética).
  await expect(modal.locator('.sc-inputtext__msg--error')).toBeVisible();
  await expect(page.getByRole('button', { name: /^(crear|guardar)/i })).toBeDisabled();
});
