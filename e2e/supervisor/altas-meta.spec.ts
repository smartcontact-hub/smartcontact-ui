import { expect, test, type Page } from '@playwright/test';

import { colorEfectivo } from '../shared/color';
import {
  asegurarBuildFresco,
  disableAnimations,
  elegirTelefonoSaliente,
  forceDarkTheme,
  forceLightTheme,
  goto,
  irASeccion,
  pickSelectOption,
} from './helpers';

/**
 * LAS ALTAS DICEN LO QUE FALTA, HASTA «LISTO PARA CREAR» (DD-136).
 *
 * Es el efecto de gradiente de meta: cuanto menos le falta a un formulario, antes se termina. Las altas nacen con los
 * valores de Contact Center (DD-135), y el resumen dice lo poco que queda: «Falta: nombre, extensión». En cuanto el
 * botón «Crear …» se enciende, «Listo para crear». Sin porcentaje ni barra (DD-121, DD-126).
 *
 * Lo dice UN `role="status"` que cambia en su sitio: el lector lo anuncia al cambiar, y no aparece ni desaparece. Un
 * error de formato (un email mal escrito) se dice en su campo; mientras lo haya, el resumen no dice «Listo». Al
 * editar, nunca «Listo».
 *
 * Storage limpio por test → cada store vuelve a su seed.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** El estado del resumen. Uno solo: si hubiera dos, el lector anunciaría los dos. */
const estado = (page: Page) => page.locator('.ficha-summary').getByRole('status');
/** Lo que dice, al final de su texto: delante va el nombre del glifo de su icono, que el lector no oye. */
const dice = (texto: string): RegExp => new RegExp(`(?:^|\\s)${texto}\\s*$`);
const boton = (page: Page, nombre: string) => page.getByRole('button', { name: nombre, exact: true });
const canal = (page: Page, nombre: string) =>
  page.locator('#group-section-general sc-checkbox').filter({ hasText: new RegExp(`^\\s*${nombre}\\s*$`) });

test('grupo · dice qué falta y, con nombre, un canal y su teléfono saliente, «Listo para crear»', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  // Teléfono ya viene marcado, y con él el teléfono saliente es obligatorio (DD-142): faltan los dos.
  await expect(estado(page)).toHaveCount(1);
  await expect(estado(page)).toHaveText(dice('Falta: nombre, teléfono saliente'));
  await expect(boton(page, 'Crear grupo')).toBeDisabled();

  await page.locator('#group-name').fill(`E2E Meta ${Date.now()}`);
  await expect(estado(page)).toHaveText(dice('Falta: teléfono saliente'));
  await elegirTelefonoSaliente(page);
  await expect(estado(page)).toHaveText(dice('Listo para crear'));
  await expect(boton(page, 'Crear grupo')).toBeEnabled();

  await irASeccion(page, 'General');

  await canal(page, 'Teléfono').click();
  await expect(estado(page)).toHaveText(dice('Falta: canales'));
  await expect(boton(page, 'Crear grupo')).toBeDisabled();
});

test('grupo · con un nombre repetido no dice «Listo»: el error va en su campo', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  // «Online Support» es el grupo 11 del seed.
  await page.locator('#group-name').fill('Online Support');
  await expect(boton(page, 'Crear grupo')).toBeDisabled();
  await expect(estado(page)).toHaveCount(1);
  await expect(estado(page)).not.toHaveText(/Listo/);
});

test('agente · dice que faltan nombre y extensión y, con los dos, «Listo para crear»', async ({ page }) => {
  await goto(page, 'admin/agentes/crear');
  await expect(estado(page)).toHaveCount(1);
  await expect(estado(page)).toHaveText(dice('Falta: nombre, extensión'));
  await expect(boton(page, 'Crear agente')).toBeDisabled();

  await page.locator('#agent-name').fill(`E2E Meta ${Date.now()}`);
  await expect(estado(page)).toHaveText(dice('Falta: extensión'));

  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#agent-ext') }), /./);
  await expect(estado(page)).toHaveText(dice('Listo para crear'));
  await expect(boton(page, 'Crear agente')).toBeEnabled();

  // Un email mal escrito apaga el botón: el resumen deja de decir «Listo», y el motivo va en el campo.
  await page.locator('#agent-email').fill('sin-arroba');
  await expect(boton(page, 'Crear agente')).toBeDisabled();
  await expect(estado(page)).not.toHaveText(/Listo/);
});

test('usuario · dice que faltan nombre y email y, con los dos, «Listo para crear»', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');
  await expect(estado(page)).toHaveCount(1);
  await expect(estado(page)).toHaveText(dice('Falta: nombre, email'));
  await expect(boton(page, 'Crear usuario')).toBeDisabled();

  await page.locator('#user-name').fill(`E2E Meta ${Date.now()}`);
  await page.locator('#user-email').fill('e2e.meta@smartcontact.test');
  await expect(estado(page)).toHaveText(dice('Listo para crear'));
  await expect(boton(page, 'Crear usuario')).toBeEnabled();
});

test('al editar no dice «Listo»: la ficha ya existe', async ({ page }) => {
  for (const ruta of ['admin/grupos/editar/11', 'admin/agentes/editar/1', 'admin/usuarios/editar/1']) {
    await goto(page, ruta);
    await expect(page.locator('.ficha-summary .resumen__title'), ruta).toBeVisible();
    await expect(page.locator('.ficha-summary'), ruta).not.toContainText('Listo para crear');
  }
});

/* «Listo» solo sale al rellenar, así que `theme-contrast`, que abre las altas vacías, mide «Falta» y no a él. Texto de
 * 12 en semibold: AA pide 4,5:1, en los dos temas. */
for (const [tema, aplicar] of [
  ['claro', forceLightTheme],
  ['oscuro', forceDarkTheme],
] as const) {
  test(`«Listo para crear» se lee sobre su fondo en tema ${tema}`, async ({ page }) => {
    await aplicar(page);
    await goto(page, 'admin/grupos/crear');
    await asegurarBuildFresco(page);
    await page.locator('#group-name').fill(`E2E Meta ${Date.now()}`);
    await elegirTelefonoSaliente(page);
    await expect(estado(page)).toHaveText(dice('Listo para crear'));
    const { ratio } = await estado(page).evaluate(colorEfectivo);
    expect(ratio, `«Listo para crear» en tema ${tema}`).toBeGreaterThanOrEqual(4.5);
  });
}
