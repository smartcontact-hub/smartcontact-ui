import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, openKebabAction } from './helpers';

/**
 * DUPLICAR TIPIFICACIONES Y EQUIPOS, COMO GRUPOS Y AGENTES (DD-232). Duplicar no crea nada en el acto: abre el alta
 * («Nueva tipificación», «Nuevo equipo») rellena con «X (1)» y todo lo del original; la copia existe al pulsar «Crear».
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const guardado = (page: import('@playwright/test').Page, clave: string) =>
  page.evaluate((k) => (JSON.parse(localStorage.getItem(k) ?? '[]') as { name: string }[]).map((x) => x.name), clave);

test('tipificaciones · Duplicar abre el alta con el árbol copiado y la copia solo existe al crear', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  const antes = await guardado(page, 'sc-tipificaciones');
  await openKebabAction(page, 'Ventas salientes', 'Duplicar');

  await expect(page).toHaveURL(/\/admin\/tipificaciones\/crear\?seedFromId=2$/);
  await expect(page.locator('#tip-name')).toHaveValue('Ventas salientes (1)');
  expect(await guardado(page, 'sc-tipificaciones'), 'todavía no existe').toEqual(antes);
  // El árbol del original, a la vista.
  await page.getByText('Categorías', { exact: true }).first().click();
  const valores = () => page.locator('input').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
  await expect.poll(valores).toEqual(expect.arrayContaining(['Contactado', 'No contactado', 'Venta', 'Buzón de voz']));

  await page.locator('sc-top-bar').getByRole('button', { name: 'Crear tipificación' }).click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones\/editar\/\d+/);
  expect(await guardado(page, 'sc-tipificaciones')).toContain('Ventas salientes (1)');
});

test('tipificaciones · salir de la copia sin crear no deja nada en la lista', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  const antes = await guardado(page, 'sc-tipificaciones');
  await openKebabAction(page, 'Soporte técnico', 'Duplicar');
  await expect(page.locator('#tip-name')).toHaveValue('Soporte técnico (1)');
  await goto(page, 'admin/tipificaciones');
  expect(await guardado(page, 'sc-tipificaciones')).toEqual(antes);
});

test('equipos · Duplicar abre el alta con la descripción y los agentes copiados', async ({ page }) => {
  await goto(page, 'admin/equipos');
  const antes = await guardado(page, 'sc-equipos');
  await openKebabAction(page, 'Inglés', 'Duplicar');

  await expect(page).toHaveURL(/\/admin\/equipos\/crear\?seedFromId=1$/);
  await expect(page.locator('#grupo-agentes-name')).toHaveValue('Inglés (1)');
  await expect(page.locator('#grupo-agentes-description')).toHaveValue('Atienden en inglés');
  expect(await guardado(page, 'sc-equipos'), 'todavía no existe').toEqual(antes);
  // Los agentes del original llegan marcados.
  await expect(page.locator('.assign-bar__count')).not.toContainText(/^\s*0\s/);

  await page.locator('sc-top-bar').getByRole('button', { name: 'Crear equipo' }).click();
  await expect(page).toHaveURL(/\/admin\/equipos\/editar\/\d+/);
  expect(await guardado(page, 'sc-equipos')).toContain('Inglés (1)');
});
