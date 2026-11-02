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

/* Y las demás fichas de Repositorios y Plantillas hacen lo mismo (DD-238): el último tramo es el nombre GUARDADO, no
 * «Editar …», y el alta lleva el de la ruta. */
for (const [ruta, nombre, alta, tituloEditable] of [
  ['admin/agendas/editar/10', 'Clientes VIP', 'admin/agendas/crear', '#agenda-name'],
  ['admin/plantillas/editar/3', 'Despedida chat', 'admin/plantillas/crear', '#template-title'],
  ['admin/emails/cuentas/editar/1', 'soporte@example.com', 'admin/emails/cuentas/crear', '#mailbox-name'],
  ['admin/emails/triggers/editar/1', 'Facturas', 'admin/emails/triggers/crear', '#trigger-name'],
] as const) {
  test(`miga · ${ruta.split('/')[1]}${ruta.split('/')[2] === 'cuentas' || ruta.split('/')[2] === 'triggers' ? ' ' + ruta.split('/')[2] : ''}: la edición acaba en su nombre guardado`, async ({ page }) => {
    const ultimo = page.locator('sc-top-bar sc-breadcrumb .p-breadcrumb-list > li').last();
    await goto(page, ruta);
    await expect(ultimo).toHaveText(nombre);
    await goto(page, alta);
    await expect(ultimo).not.toHaveText(/^Editar/);
    if (tituloEditable) {
      await goto(page, ruta);
      await page.locator(tituloEditable).fill(`${nombre} bis`);
      await expect(ultimo, 'lo tecleado aún no es el nombre guardado').toHaveText(nombre);
    }
  });
}

/* Agendas, Plantillas, Email y Labels abren la miga con «Administración», como Tipificaciones, Grupos y Agentes (DD-238;
 * Labels, DD-245). */
for (const [ruta, ultimo] of [
  ['admin/agendas', 'Agendas'],
  ['admin/plantillas', 'Plantillas'],
  ['admin/emails', 'Email'],
  ['admin/labels', 'Labels'],
] as const) {
  test(`miga · ${ruta}: Administración › Repositorios › ${ultimo}`, async ({ page }) => {
    await goto(page, ruta);
    const tramos = page.locator('sc-top-bar sc-breadcrumb .p-breadcrumb-list > li');
    await expect(tramos.filter({ hasText: 'Administración' })).toHaveCount(1);
    await expect(tramos.filter({ hasText: 'Repositorios' })).toHaveCount(1);
    await expect(tramos.last()).toHaveText(ultimo);
  });
}

