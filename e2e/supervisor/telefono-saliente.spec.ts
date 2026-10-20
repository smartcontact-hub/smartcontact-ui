import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, elegirTelefonoSaliente, forceLightTheme, goto } from './helpers';

/**
 * CON TELÉFONO, EL TELÉFONO SALIENTE ES OBLIGATORIO Y SALE DE LOS NÚMEROS ASIGNADOS (DD-142).
 *
 * La segunda revisión con el equipo (2026-10-01) fija dos campos obligatorios en un grupo: el nombre y, si tiene
 * Teléfono, el número que ven los clientes cuando un agente del grupo llama. Y ese número no se inventa: es uno de los
 * asignados a la cuenta, los que tienen call blending. Hasta hoy se podía dejar vacío y se podía escribir cualquiera.
 *
 * Lo que fija:
 *   1. En el alta, «Crear grupo» sin él no crea: lo dice su campo y el índice, y lleva a él (DD-216); con uno elegido,
 *      se crea.
 *   2. Al editar un grupo con Teléfono y sin número (el duplicado de antes lo vaciaba), su campo lo dice y su sección
 *      lleva el punto del índice con su texto, desde que se abre.
 *   3. Se elige de una lista cerrada: no hay campo donde escribir, y su ayuda ya no dice «escríbelo».
 *   4. Duplicar se lo lleva: la copia sale con el del original, sin diálogo (DD-216).
 *
 * Storage limpio por test → cada almacén vuelve a su semilla.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const OBLIGATORIO = 'El teléfono saliente es obligatorio';
const boton = (page: Page, nombre: string) => page.getByRole('button', { name: nombre, exact: true });
/** El campo entero (desplegable, ayuda y error), por su desplegable. */
const campoTelefono = (page: Page, id = 'group-phone') => page.locator(`sc-select:has(#${id})`);

test('alta · con Teléfono, «Crear grupo» sin teléfono saliente no crea: lo dice su campo y lleva a él', async ({ page }) => {
  await goto(page, 'admin/grupos/crear');
  const nombre = `E2E Saliente ${Date.now()}`;
  await page.locator('#group-name').fill(nombre);
  // Teléfono ya viene marcado, y su campo está en Distribución y colas: nada lo dice hasta pulsar.
  await expect(page.locator('sc-form-section-nav .form-nav__item--has-error')).toHaveCount(0);
  await boton(page, 'Crear grupo').click();
  await expect(page).toHaveURL(/admin\/grupos\/crear/);
  await expect(campoTelefono(page)).toContainText(OBLIGATORIO);
  await expect(page.locator('#group-phone')).toBeFocused();

  await elegirTelefonoSaliente(page, '918371548');
  await expect(campoTelefono(page)).not.toContainText(OBLIGATORIO);
  await boton(page, 'Crear grupo').click();
  await expect(page).toHaveURL(/admin\/grupos\/editar\/\d+/);
  await expect(page.locator('.headline__meta')).toContainText('918371548');
});

test('editar · un grupo con Teléfono y sin número lo dice en su campo y en el índice desde que se abre', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sc-groups-v', '4');
    localStorage.setItem(
      'sc-groups',
      JSON.stringify([
        { id: 1, code: '20001', name: 'E2E Sin saliente', phone: '', priority: 'Baja', channels: ['phone'], strategy: 'Balanceada' },
      ]),
    );
  });
  await goto(page, 'admin/grupos/editar/1?seccion=distribucion');
  await expect(campoTelefono(page)).toContainText(OBLIGATORIO);
  const seccion = page.locator('sc-form-section-nav .form-nav__item', { hasText: 'Distribución y colas' });
  await expect(seccion).toHaveClass(/form-nav__item--has-error/);
  await expect(seccion).toContainText(OBLIGATORIO);
  // Sin cambios no hay nada que guardar; sin motivo junto al botón (DD-216).
  await expect(boton(page, 'Guardar')).toBeDisabled();
  await expect(page.locator('.form-save-reason')).toHaveCount(0);

  await elegirTelefonoSaliente(page, '917945449');
  await expect(campoTelefono(page)).not.toContainText(OBLIGATORIO);
  await expect(page.locator('sc-form-section-nav .form-nav__item--has-error')).toHaveCount(0);
  await expect(boton(page, 'Guardar')).toBeEnabled();
});

test('el teléfono saliente se elige de los números asignados: no hay campo donde escribir otro', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/1?seccion=distribucion');
  const campo = campoTelefono(page);
  await expect(campo).toBeVisible();
  // Un desplegable que deja escribir pinta un <input>; uno cerrado, solo su combobox, nombrado por su rótulo.
  await expect(campo.locator('input')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Teléfono saliente', exact: true })).toBeVisible();
  await expect(campo).toContainText('El número que ve el cliente cuando le llaman.');
  await expect(campo).not.toContainText('escríbelo');

  await campo.locator('.p-select-dropdown').click();
  const opciones = page.locator('.p-select-overlay .p-select-option');
  await expect(opciones.first()).toBeVisible();
  expect((await opciones.allInnerTexts()).map((t) => t.trim()).sort()).toEqual(['917945449', '918371548']);
});

test('duplicar se lleva el teléfono saliente: la copia sale con el del original, sin diálogo (DD-216)', async ({ page }) => {
  await goto(page, 'admin/grupos');
  // Reclamaciones tiene Teléfono, con el 918371548.
  await page.locator('tbody tr', { hasText: 'Reclamaciones' }).locator('.rules-kebab-btn').click();
  await page.getByRole('menuitem', { name: 'Duplicar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/admin\/grupos\/editar\/\d+$/);
  await expect(page.locator('.headline__name')).toHaveText('Reclamaciones (1)');
  await expect(page.locator('.headline__meta')).toContainText('918371548');
});
