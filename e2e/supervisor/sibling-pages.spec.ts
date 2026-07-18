import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * Consistencia entre las tres páginas hermanas de Memory (reglas · categorías ·
 * entidades): mismo gesto de fila, mismo vacío, kebabs predecibles.
 *
 * Antes: la fila solo era clicable en Reglas, Entidades tenía su propio vacío a
 * medida y Categorías mostraba el estado ACTIVA/INACTIVA sin ofrecer forma de
 * cambiarlo.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('categorías · la fila abre la edición', async ({ page }) => {
  await goto(page, 'conversaciones/categorias');

  const name = (await page.locator('tbody tr td').first().innerText()).split('·')[0].trim();
  await page.locator('tbody tr').first().click();

  const modal = page.locator('sc-memory-category-form-modal .p-dialog');
  await expect(modal).toBeVisible();
  await expect(modal.locator('input').first()).toHaveValue(name);
});

test('categorías · el kebab permite activar y desactivar', async ({ page }) => {
  await goto(page, 'conversaciones/categorias');

  const row = page.locator('tbody tr').first();
  await expect(row.locator('.rules-status--active')).toBeVisible();

  await row.locator('.rules-kebab-btn').click();
  await page.locator('.p-menu-overlay .p-menu-item-link', { hasText: /desactivar/i }).click();

  await expect(row.locator('.rules-status--inactive')).toBeVisible();

  // Y vuelve: la acción es simétrica.
  await row.locator('.rules-kebab-btn').click();
  await page.locator('.p-menu-overlay .p-menu-item-link', { hasText: /activar/i }).click();
  await expect(row.locator('.rules-status--active')).toBeVisible();
});

test('entidades · la fila abre la edición', async ({ page }) => {
  await goto(page, 'conversaciones/entidades');

  const row = page.locator('.entities-table:not(.entities-table--readonly) tbody tr').first();
  const name = (await row.locator('code').first().innerText()).trim();
  await row.click();

  const modal = page.locator('sc-memory-entity-form-modal .p-dialog');
  await expect(modal).toBeVisible();
  await expect(modal.locator('input').first()).toHaveValue(name);
});

test('las tres hermanas comparten el mismo componente de vacío', async ({ page }) => {
  // Entidades: se vacía y debe salir el `sc-empty-state` compartido, no un div propio.
  await goto(page, 'conversaciones/entidades');
  const rows = page.locator('.entities-table:not(.entities-table--readonly) tbody tr');
  for (let remaining = await rows.count(); remaining > 0; remaining -= 1) {
    await rows.first().locator('.rules-kebab-btn').click();
    await page.locator('.p-menu-overlay .p-menu-item-link', { hasText: /eliminar/i }).click();
    await page
      .locator('.p-confirmdialog')
      .getByRole('button', { name: /eliminar|confirmar/i })
      .click();
    await expect(rows).toHaveCount(remaining - 1);
  }

  await expect(page.locator('sc-empty-state')).toBeVisible();
  await expect(page.locator('.entities-empty')).toHaveCount(0);
});
