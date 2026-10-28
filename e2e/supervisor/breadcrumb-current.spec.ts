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

/* SISMAC-4058 (2026-10-20): en la edición de un grupo, y de su gemela la de agente, el último tramo es el nombre GUARDADO
 * («Administración › Grupos › Online Support»), no «Editar grupo»; mientras se teclea no cambia, y al guardar sí. En el
 * alta, el de la ruta. */
test('miga · la edición de un grupo o un agente acaba en su nombre guardado, y el alta en «Nuevo»', async ({ page }) => {
  const ultimo = page.locator('sc-top-bar sc-breadcrumb .p-breadcrumb-list > li').last();
  await goto(page, 'admin/agentes/editar/1');
  await expect(ultimo).toHaveText('Tom Hanks');
  await goto(page, 'admin/grupos/crear');
  await expect(ultimo).toHaveText('Nuevo grupo');
  await goto(page, 'admin/grupos/editar/11');
  await expect(ultimo).toHaveText('Online Support');

  await page.locator('.headline__name .p-inplace-display').click();
  await page.locator('.name-inplace__input').fill('Soporte en línea');
  await page.locator('.name-inplace__input').press('Enter');
  await expect(ultimo, 'lo tecleado aún no es el nombre del grupo').toHaveText('Online Support');
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(ultimo).toHaveText('Soporte en línea');

  // Y al salir, la de la página a la que se llega.
  await page.locator('sc-top-bar sc-breadcrumb').getByRole('link', { name: 'Grupos', exact: true }).click();
  await expect(ultimo).toHaveText('Grupos');
});

/* La de una tipificación hace lo mismo que la de un grupo o un agente (COA de Tipificaciones): acaba en su nombre GUARDADO,
 * no en «Editar tipificación»; mientras se teclea no cambia, y al guardar sí. En el alta, el de la ruta. */
test('miga · la edición de una tipificación acaba en su nombre guardado, y el alta en «Nueva tipificación»', async ({ page }) => {
  const ultimo = page.locator('sc-top-bar sc-breadcrumb .p-breadcrumb-list > li').last();
  await goto(page, 'admin/tipificaciones/crear');
  await expect(ultimo).toHaveText('Nueva tipificación');
  await goto(page, 'admin/tipificaciones/editar/1');
  await expect(ultimo).toHaveText('Atención al cliente');

  await page.locator('#tip-name').fill('Atención al cliente VIP');
  await expect(ultimo, 'lo tecleado aún no es el nombre de la tipificación').toHaveText('Atención al cliente');
  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(ultimo).toHaveText('Atención al cliente VIP');
});
