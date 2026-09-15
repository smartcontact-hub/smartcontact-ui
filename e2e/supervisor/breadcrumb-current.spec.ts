import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA MIGA DICE EN QUÉ PÁGINA ESTÁS TAMBIÉN A QUIEN NO LA VE.
 *
 * El último tramo es la página actual y lleva `aria-current="page"` (APG Breadcrumb; la guía de
 * primeng.dev lo pide y PrimeNG Angular no lo pone, DD-103). Solo el último: un padre marcado como actual
 * mentiría al lector de pantalla.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('miga · solo el último tramo es la página actual', async ({ page }) => {
  await goto(page, 'admin/usuarios');
  const tramos = page.locator('sc-breadcrumb .p-breadcrumb-item-link');
  await expect(tramos.last()).toContainText('Usuarios');
  const marcados = await tramos.evaluateAll((as) => as.map((a) => a.getAttribute('aria-current')));
  expect(marcados.length, 'la miga no tiene tramos: no mide nada').toBeGreaterThan(1);
  expect(marcados.at(-1)).toBe('page');
  expect(marcados.slice(0, -1).every((v) => v === null), `un padre se anuncia como actual: ${marcados}`).toBe(true);
});
