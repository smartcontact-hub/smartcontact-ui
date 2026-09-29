import { expect, test, type Page } from '@playwright/test';

import { colorEfectivo } from '../shared/color';
import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * LAS ALTAS VAN EN PASOS: EL STEPPER VERTICAL NATIVO DE PRIMENG (DD-137).
 *
 * En el alta, los pasos en columna: cada uno abre su contenido debajo y, al dejarlo completo, lleva ✓. La edición
 * sigue con el índice lateral (DD-122). Los pasos salen de las mismas secciones que el índice, en el mismo orden.
 *
 * Lo que fija:
 *   1. El Stepper tiene nombre, sus pasos son los de la ficha y en el alta no hay índice.
 *   2. Grupo: General es la puerta (DD-121). Sin nombre, los demás pasos están apagados, y «Siguiente» dice qué falta
 *      y lleva el foco al campo. Con él, «Siguiente» y «Atrás» llevan el foco a la pestaña del paso nuevo.
 *   3. Un paso que se deja completo lleva ✓ y su pestaña lo dice («completado»); el ✓ se ve (3:1).
 *   4. Cambiar de paso no toca la dirección ni el historial: Atrás del navegador sale del alta.
 *   5. Agente y usuario: los pasos, en cualquier orden.
 *   6. Crear desde un paso lleva a la edición en esa sección, con su índice.
 *   7. Al editar, el índice de siempre y ningún Stepper.
 *
 * Storage limpio por test → cada store vuelve a su seed.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const pasos = (page: Page) => page.getByRole('tablist', { name: 'Pasos del alta' });
const pestanas = (page: Page) => pasos(page).getByRole('tab');
/** El paso abierto: el nativo marca `aria-current="step"` en la envoltura de su pestaña. */
const pasoActual = (page: Page) => page.locator('p-step[aria-current="step"]');

test('grupo · el alta va en pasos, con los de la ficha en su orden, y sin índice', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  await expect(pasos(page)).toBeVisible();
  await expect(pestanas(page)).toHaveText([/General/, /Distribución y colas/, /Recursos/, /Agentes/]);
  await expect(pasoActual(page)).toContainText('General');
  await expect(page.locator('sc-form-section-nav')).toHaveCount(0);
});

test('grupo · sin nombre los demás pasos están apagados, y «Siguiente» dice qué falta y lleva el foco al nombre', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  for (const i of [1, 2, 3]) await expect(pestanas(page).nth(i), `paso ${i + 1}`).toBeDisabled();

  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page.getByText('El nombre es obligatorio')).toBeVisible();
  await expect(page.locator('#group-name')).toBeFocused();
  await expect(pasoActual(page)).toContainText('General');

  await page.locator('#group-name').fill(`E2E Pasos ${Date.now()}`);
  for (const i of [1, 2, 3]) await expect(pestanas(page).nth(i), `paso ${i + 1}`).toBeEnabled();
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(pasoActual(page)).toContainText('Distribución y colas');
  await expect(pestanas(page).nth(1)).toBeFocused();

  await page.getByRole('button', { name: 'Atrás', exact: true }).click();
  await expect(pasoActual(page)).toContainText('General');
  await expect(pestanas(page).nth(0)).toBeFocused();
});

test('grupo · el paso que se deja completo lleva ✓, su pestaña lo dice y el ✓ se ve', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill(`E2E Pasos ${Date.now()}`);
  // Aún no se ha dejado: sin ✓.
  await expect(pestanas(page).nth(0)).not.toHaveAccessibleName(/completado/);

  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(pestanas(page).nth(0)).toHaveAccessibleName(/General.*completado/);
  const check = pestanas(page).nth(0).locator('sc-icon .sc-icon');
  await expect(check).toBeVisible();
  expect((await check.evaluate(colorEfectivo)).ratio, 'el ✓ sobre su fondo').toBeGreaterThanOrEqual(3);
  // El que está abierto no lleva ✓ aunque esté bien: aún no se ha dejado.
  await expect(pestanas(page).nth(1)).not.toHaveAccessibleName(/completado/);
});

test('grupo · cambiar de paso no toca la dirección ni el historial', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  const direccion = page.url();
  const historial = await page.evaluate(() => history.length);

  await page.locator('#group-name').fill(`E2E Pasos ${Date.now()}`);
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await pestanas(page).nth(3).click();
  await expect(pasoActual(page)).toContainText('Agentes');

  expect(page.url()).toBe(direccion);
  expect(await page.evaluate(() => history.length)).toBe(historial);
  // El último paso no lleva «Siguiente»: se crea con el botón de arriba.
  await expect(page.getByRole('button', { name: 'Siguiente', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Atrás', exact: true })).toBeVisible();
});

test('agente · los pasos van en cualquier orden: sin nombre se llega a Permisos', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  await expect(pestanas(page)).toHaveText([/Identidad/, /Grupos asignados/, /Permisos/, /Recursos/, /Avanzado/]);
  await pestanas(page).nth(2).click();
  await expect(pasoActual(page)).toContainText('Permisos');
  await expect(page.locator('#agent-section-permissions')).toBeVisible();
  await expect(page.locator('sc-form-section-nav')).toHaveCount(0);
});

test('usuario · los pasos van en cualquier orden: sin nombre se llega a Acceso', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');
  await expect(pestanas(page)).toHaveText([/Identidad/, /Acceso/, /Servicios asignados/]);
  await pestanas(page).nth(1).click();
  await expect(pasoActual(page)).toContainText('Acceso');
  await expect(page.locator('#user-section-access')).toBeVisible();
});

test('crear desde un paso lleva a la edición en esa sección, con su índice', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  await page.locator('#agent-name').fill(`E2E Pasos ${Date.now()}`);
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#agent-ext') }), /./);
  await pestanas(page).nth(2).click();
  await page.getByRole('button', { name: 'Crear agente', exact: true }).click();

  await expect(page).toHaveURL(/\/admin\/agentes\/editar\/\d+\?seccion=permisos$/);
  await expect(page.locator('sc-form-section-nav')).toBeVisible();
  await expect(page.locator('p-stepper')).toHaveCount(0);
});

test('al editar, el índice de siempre y ningún Stepper', async ({ page }) => {
  for (const ruta of ['admin/grupos/editar/11', 'admin/agentes/editar/1', 'admin/usuarios/editar/1']) {
    await goto(page, ruta);
    await expect(page.locator('sc-form-section-nav'), ruta).toBeVisible();
    await expect(page.locator('p-stepper'), ruta).toHaveCount(0);
  }
});
