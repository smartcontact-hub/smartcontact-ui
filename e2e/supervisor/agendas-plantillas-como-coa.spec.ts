import { expect, test } from '@playwright/test';

import { goto } from './helpers';

/**
 * AGENDAS Y PLANTILLAS COMO SUS PÁGINAS DE COA (SISMAC-4440 y 4438, DD-245):
 *   1. la tabla de contactos deja fijos Nombre (a la izquierda) y el «⋮» (a la derecha) al desplazar de lado;
 *   2. el título de una plantilla que no cabe se corta con «…» y se lee entero al pasar el ratón;
 *   3. en el editor de plantillas, Ctrl/Cmd + S con algo pendiente lo dice en rojo y lleva al campo, como Agendas;
 *   4. dejar el contenido vacío lo dice en rojo, como el título.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('contactos: Nombre y el «⋮» se quedan fijos al desplazar la tabla de lado', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/10');
  const tabla = page.locator('sc-agenda-contacts-table');
  await expect(tabla.locator('thead th[data-field="name"]')).toHaveClass(/p-datatable-frozen-column/);
  await expect(tabla.locator('tbody tr').first().locator('td').last()).toHaveClass(/p-datatable-frozen-column/);
});

test('plantillas: el título que no cabe se corta y se lee entero al pasar el ratón', async ({ page }) => {
  await goto(page, 'admin/plantillas?datos=tortura');
  const titulos = page.locator('.table__title-text');
  await expect(titulos.first()).toBeVisible();
  const cortado = await titulos.evaluateAll((els) => els.findIndex((e) => e.scrollWidth > e.clientWidth + 1));
  expect(cortado, 'algún título de tortura no cabe').toBeGreaterThanOrEqual(0);
  const titulo = titulos.nth(cortado);
  const texto = (await titulo.textContent())!.trim();
  await titulo.hover();
  await expect(page.locator('.p-tooltip')).toHaveText(texto);
});

test('plantillas: Ctrl/Cmd + S con el título vacío lo dice en rojo y lleva al campo', async ({ page }) => {
  await goto(page, 'admin/plantillas/crear');
  await page.locator('body').click();
  await page.keyboard.press('ControlOrMeta+s');
  await expect(page.locator('.sc-field__msg--error', { hasText: 'El título es obligatorio' })).toHaveCount(1);
  await expect(page.locator('#template-title')).toBeFocused();
});

test('plantillas: dejar el contenido vacío lo dice en rojo, como el título', async ({ page }) => {
  await goto(page, 'admin/plantillas/crear');
  const contenido = page.locator('.template-editor .ql-editor');
  await expect(page.locator('.template-editor__hint', { hasText: 'El contenido es obligatorio' })).toHaveCount(1);
  await contenido.click();
  await page.locator('#template-title').click();
  await expect(page.locator('.field__error', { hasText: 'El contenido es obligatorio' })).toHaveCount(1);
});
