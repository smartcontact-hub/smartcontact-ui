import { expect, test, type Locator, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion, pickSelectOption } from './helpers';

/**
 * EN EL ALTA, ✓ EN TODA SECCIÓN QUE SE DEJA COMPLETA (DD-158, DD-211 §6), Y SIN PUERTAS (DD-217).
 *
 * La revisión de producto del 2026-10-04 pidió tres cosas del alta:
 *   1. el ✓ solo donde había algo obligatorio (DD-158). La revisión del 2026-10-16 lo cambia (DD-211 §6): lo lleva toda
 *      sección que se deja completa, y la que no tiene nada obligatorio lo está con solo pasar (Recursos y Agentes del
 *      grupo, Configuración y Recursos del agente, Acceso del usuario): el índice dice por dónde se ha pasado ya. Las
 *      que tienen algo obligatorio, solo completas: General y, con Teléfono, Distribución y colas; en el agente,
 *      General y Grupos;
 *   2. con Teléfono, no se salía de Distribución y colas sin teléfono saliente, como no se salía de General sin nombre.
 *      DD-217 quita las dos puertas: se sale, sin ✓ ni rojo, y lo que falta se dice al pulsar «Crear grupo»
 *      (`indice-errores`);
 *   3. «Atrás» y «Siguiente», como en el Stepper vertical de primeng.dev con los botones del DS: juntos a la
 *      izquierda, «Atrás» secundario y «Siguiente» el principal, rellenos y sin icono.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const fila = (page: Page, etiqueta: string) => page.locator('sc-form-section-nav .form-nav__item').filter({ hasText: etiqueta });
const actual = (page: Page) => page.locator('sc-form-section-nav .form-nav__item[aria-current="page"]');
const siguiente = (page: Page) => page.getByRole('button', { name: 'Siguiente', exact: true });
const atras = (page: Page) => page.getByRole('button', { name: 'Atrás', exact: true });
const completa = /Esta sección está completa/;

async function grupoConNombre(page: Page): Promise<void> {
  await goto(page, 'admin/grupos/crear');
  await page.locator('#group-name').fill(`E2E Obligatorio ${Date.now()}`);
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Distribución y colas');
}

test('grupo · sin teléfono saliente se sale de Distribución y colas, en rojo con lo que falta (DD-217, DD-222)', async ({ page }) => {
  await grupoConNombre(page);

  // Con «Siguiente» y con el índice: sin puerta. Al dejarla sin el teléfono saliente, el índice la marca en rojo con lo
  // que le falta (DD-222).
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Recursos');
  await expect(fila(page, 'Distribución y colas')).not.toHaveAccessibleName(/Completa/);
  await expect(fila(page, 'Distribución y colas')).toHaveClass(/form-nav__item--has-error/);
  await expect(fila(page, 'Distribución y colas')).toContainText('Teléfono saliente');
  await fila(page, 'Agentes').click();
  await expect(actual(page)).toContainText('Agentes');

  // Con el número, al volver a dejarla, ✓.
  await irASeccion(page, 'Distribución y colas');
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#group-phone') }), /./);
  await siguiente(page).click();
  await expect(fila(page, 'Distribución y colas')).toHaveAccessibleName(/Completa/);
});

test('grupo · ✓ en toda sección que se deja completa: General y Distribución, y también Recursos y Agentes (DD-211 §6)', async ({ page }) => {
  await grupoConNombre(page);
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#group-phone') }), /./);
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Recursos');
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Agentes');
  await atras(page).click();
  await expect(actual(page)).toContainText('Recursos');

  await expect(fila(page, 'General')).toHaveAccessibleName(/Completa/);
  await expect(fila(page, 'Distribución y colas')).toHaveAccessibleName(/Completa/);
  // Agentes se dejó, y sin nada obligatorio está «Revisada» con solo pasar, con su marcador verde (DD-211 §6, DD-222).
  await expect(fila(page, 'Agentes')).toHaveAccessibleName(/Revisada/);
  await expect(fila(page, 'Agentes').locator('sc-step-marker.sc-step-marker--hecha')).toHaveCount(1);
  await siguiente(page).click();
  await expect(fila(page, 'Recursos')).toHaveAccessibleName(/Revisada/);
  await expect(fila(page, 'Recursos').locator('sc-step-marker.sc-step-marker--hecha')).toHaveCount(1);
});

test('agente · ✓ en toda sección que se deja completa: General y Grupos, y también Configuración y Recursos (DD-211 §6)', async ({
  page,
}) => {
  await goto(page, 'admin/agentes/crear');
  await page.locator('#agent-name').fill(`E2E Obligatorio ${Date.now()}`);
  await page.locator('#agent-email').fill(`e2e.obligatorio.${Date.now()}@example.com`);
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#agent-ext') }), /./);
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Configuración');
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Recursos');
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Grupos');
  await page.locator('sc-group-assignment-table tbody tr').first().getByRole('checkbox', { name: /^Asignado —/ }).click();
  await atras(page).click();
  await expect(actual(page)).toContainText('Recursos');

  // Con los marcadores del grupo desde DD-225 (DD-222): «Completa» donde hay algo que cumplir, y «Revisada» con solo
  // pasar donde no hay nada, con su marcador verde (DD-211 §6).
  await expect(fila(page, 'General')).toHaveAccessibleName(/Completa/);
  await expect(fila(page, 'Grupos')).toHaveAccessibleName(/Completa/);
  await expect(fila(page, 'Configuración')).toHaveAccessibleName(/Revisada/);
  await expect(fila(page, 'Configuración').locator('sc-step-marker.sc-step-marker--hecha')).toHaveCount(1);
  await siguiente(page).click();
  await expect(fila(page, 'Recursos')).toHaveAccessibleName(/Revisada/);
  await expect(fila(page, 'Recursos').locator('sc-step-marker.sc-step-marker--hecha')).toHaveCount(1);
});

test('el pie: «Atrás» y «Siguiente» juntos a la izquierda, «Siguiente» el principal, rellenos y sin icono', async ({ page }) => {
  await grupoConNombre(page);
  const [a, s] = [await atras(page).boundingBox(), await siguiente(page).boundingBox()];
  expect(a && s, 'los dos a la vista').toBeTruthy();
  expect(s!.x, '«Siguiente» tras «Atrás»').toBeGreaterThan(a!.x);
  // 10,5: el de una botonera del DS (el pie de `sc-dialog`); el ejemplo pone 8.
  expect(s!.x - (a!.x + a!.width), 'entre los dos, el aire de una botonera').toBeLessThanOrEqual(11);
  // A la izquierda: «Atrás» empieza donde empieza el contenido de la sección.
  const contenido = await page.locator('#group-section-distribution').boundingBox();
  expect(a!.x - contenido!.x, '«Atrás», al principio de la fila').toBeLessThanOrEqual(1);

  const fondo = (l: Locator) => l.evaluate((b) => getComputedStyle(b).backgroundColor);
  const principal = await fondo(page.getByRole('button', { name: 'Crear grupo', exact: true }));
  expect(await fondo(siguiente(page)), '«Siguiente», del color del botón principal').toBe(principal);
  const deAtras = await fondo(atras(page));
  expect(deAtras, '«Atrás», relleno').not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  expect(deAtras, '«Atrás», secundario').not.toBe(principal);
  await expect(atras(page).locator('sc-icon, .p-button-icon')).toHaveCount(0);
  await expect(siguiente(page).locator('sc-icon, .p-button-icon')).toHaveCount(0);
});

test('usuario · Acceso, sin nada obligatorio, lleva ✓ al dejarla (DD-211 §6)', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');
  await irASeccion(page, 'Acceso');
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Servicios asignados');
  await expect(fila(page, 'Acceso')).toHaveAccessibleName(completa);
  await expect(fila(page, 'Acceso').locator('.form-nav__done')).toHaveCount(1);
});
