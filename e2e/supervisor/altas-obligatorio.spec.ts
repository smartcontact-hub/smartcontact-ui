import { expect, test, type Locator, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion, pickSelectOption } from './helpers';

/**
 * EN EL ALTA, ✓ SOLO DONDE HAY ALGO QUE RELLENAR, Y EL TELÉFONO SALIENTE ES PUERTA (DD-158).
 *
 * La revisión de producto del 2026-10-04 pidió tres cosas del alta:
 *   1. el ✓ salía en Recursos o en Agentes solo por pasar por ellas: no comprobaba nada, y un ✓ que no comprueba nada
 *      enseña a no fiarse de los demás. Ahora lo lleva la sección con algo obligatorio que se deja completa: General y,
 *      con Teléfono, Distribución y colas. En el usuario, Identidad. En el agente, General y Grupos desde DD-187 (la
 *      revisión de agentes del 2026-10-09 hace obligatorio al menos un grupo; hasta entonces, solo Identidad);
 *   2. con Teléfono, no se sale de Distribución y colas sin teléfono saliente, como no se sale de General sin nombre:
 *      son los dos controles del alta. Se puede volver a General, donde se quita Teléfono; y saltar desde el índice a
 *      Recursos o a Agentes lleva a Distribución, a decir lo que falta;
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

test('grupo · sin teléfono saliente no se sale de Distribución y colas; a General, sí', async ({ page }) => {
  await grupoConNombre(page);

  // Ni con «Siguiente» ni con el índice: lo dice el campo.
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Distribución y colas');
  await expect(page.locator('#group-channel-phone')).toContainText('El teléfono saliente es obligatorio');
  await fila(page, 'Agentes').click();
  await expect(actual(page)).toContainText('Distribución y colas');
  await fila(page, 'Recursos').click();
  await expect(actual(page)).toContainText('Distribución y colas');

  // A General sí: es donde se quita Teléfono. Y desde General, saltar más allá lleva a Distribución.
  await atras(page).click();
  await expect(actual(page)).toContainText('General');
  await fila(page, 'Agentes').click();
  await expect(actual(page)).toContainText('Distribución y colas');

  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#group-phone') }), /./);
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Recursos');
});

test('grupo · ✓ solo en las secciones con algo obligatorio: General y Distribución; Recursos y Agentes, nunca', async ({ page }) => {
  await grupoConNombre(page);
  await pickSelectOption(page, page.locator('sc-select').filter({ has: page.locator('#group-phone') }), /./);
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Recursos');
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Agentes');
  await atras(page).click();
  await expect(actual(page)).toContainText('Recursos');

  await expect(fila(page, 'General')).toHaveAccessibleName(completa);
  await expect(fila(page, 'Distribución y colas')).toHaveAccessibleName(completa);
  // Agentes se dejó, y sin nada obligatorio: no hay nada que dar por bueno.
  await expect(fila(page, 'Agentes')).not.toHaveAccessibleName(completa);
  await expect(fila(page, 'Agentes').locator('.form-nav__done')).toHaveCount(0);
  await siguiente(page).click();
  await expect(fila(page, 'Recursos')).not.toHaveAccessibleName(completa);
  await expect(fila(page, 'Recursos').locator('.form-nav__done')).toHaveCount(0);
});

test('agente · ✓ solo en las secciones con algo obligatorio: General y Grupos; Configuración y Recursos, nunca', async ({
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

  await expect(fila(page, 'General')).toHaveAccessibleName(completa);
  await expect(fila(page, 'Grupos')).toHaveAccessibleName(completa);
  // Configuración se dejó, y sin nada obligatorio: no hay nada que dar por bueno.
  await expect(fila(page, 'Configuración')).not.toHaveAccessibleName(completa);
  await expect(fila(page, 'Configuración').locator('.form-nav__done')).toHaveCount(0);
  await siguiente(page).click();
  await expect(fila(page, 'Recursos')).not.toHaveAccessibleName(completa);
  await expect(fila(page, 'Recursos').locator('.form-nav__done')).toHaveCount(0);
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

test('usuario · ✓ solo en Identidad', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');
  await irASeccion(page, 'Acceso');
  await siguiente(page).click();
  await expect(actual(page)).toContainText('Servicios asignados');
  await expect(fila(page, 'Acceso')).not.toHaveAccessibleName(completa);
  await expect(fila(page, 'Acceso').locator('.form-nav__done')).toHaveCount(0);
});
