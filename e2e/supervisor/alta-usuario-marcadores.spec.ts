import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, irASeccion } from './helpers';

/**
 * EL ALTA DE USUARIO, CON LOS MARCADORES DEL GRUPO Y DEL AGENTE (DD-222, DD-225 §8; la deuda que DD-222 §5 dejó
 * anotada). Hasta hoy el alta de usuario llevaba «Atrás / Siguiente» pero el índice con el ✓ suelto de DD-143 y
 * «Falta: …» sobre el resumen: la única alta con pie y sin marcadores. Ahora, como las otras tres:
 *   1. Un marcador y una línea en cada fila: Identidad dice lo que falta («Nombre, email»), Acceso y Servicios
 *      asignados «Sin revisar», y «Revisada» al dejarlas (no tienen nada obligatorio).
 *   2. Dejar Identidad sin lo obligatorio la pone en rojo, y al volver sus campos lo dicen en rojo.
 *   3. Sin «Falta: …» ni «Listo para crear» sobre el resumen; el tooltip de «Crear usuario» sigue diciendo qué falta.
 *   4. «Deshacer» deja el índice como al empezar.
 *   5. Al editar, sin marcadores.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const indice = (page: Page) => page.locator('sc-form-section-nav');
const filaIndice = (page: Page, etiqueta: string) => indice(page).locator('.form-nav__item').filter({ hasText: etiqueta });
const linea = (page: Page, etiqueta: string) => filaIndice(page, etiqueta).locator('.form-nav__hint--paso');
const marcador = (page: Page, etiqueta: string, estado: string) =>
  filaIndice(page, etiqueta).locator(`sc-step-marker.sc-step-marker--${estado}`);
const siguiente = (page: Page) => page.getByRole('button', { name: 'Siguiente', exact: true });
const barra = (page: Page) => page.locator('sc-top-bar');

test('alta · el índice lleva los marcadores del grupo, sin «Falta: …» sobre el resumen; «Deshacer» lo deja como al empezar', async ({ page }) => {
  await goto(page, 'admin/usuarios/crear');
  await expect(page.locator('.resumen__status')).toHaveCount(0);
  await expect(marcador(page, 'Identidad', 'actual')).toBeVisible();
  await expect(linea(page, 'Identidad')).toHaveText('Nombre, email');
  await expect(linea(page, 'Acceso')).toHaveText('Sin revisar');
  await expect(linea(page, 'Servicios asignados')).toHaveText('Sin revisar');

  // Dejar Identidad sin lo obligatorio la pone en rojo, y al volver sus campos lo dicen en rojo.
  await page.locator('#user-name').fill('E2E Índice');
  await siguiente(page).click();
  await expect(marcador(page, 'Identidad', 'error')).toBeVisible();
  await expect(linea(page, 'Identidad')).toHaveText('Email');
  await expect(marcador(page, 'Acceso', 'actual')).toBeVisible();
  await expect(linea(page, 'Acceso')).toHaveText('En curso');
  // Acceso no tiene nada obligatorio: al dejarla, «Revisada».
  await siguiente(page).click();
  await expect(linea(page, 'Acceso')).toHaveText('Revisada');
  await expect(marcador(page, 'Acceso', 'hecha')).toBeVisible();
  await irASeccion(page, 'Identidad');
  await expect(page.locator('#user-section-identity .sc-field__msg--error')).toHaveText(['Escribe el email']);
  await expect(page.locator('#user-email')).toHaveAttribute('aria-invalid', 'true');

  // Un email mal escrito se dice también en la línea, detrás de lo que falta.
  await page.locator('#user-email').fill('sin-arroba');
  await expect(linea(page, 'Identidad')).toHaveText('Introduce un email válido');

  // Con todo, Identidad pasa a verde en vivo, aún abierta: ya se había dejado una vez (DD-222 §2).
  await page.locator('#user-email').fill('e2e.indice@smartcontact.test');
  await expect(marcador(page, 'Identidad', 'hecha')).toBeVisible();
  await irASeccion(page, 'Acceso');
  await expect(linea(page, 'Identidad')).toHaveText('Completa');

  // «Deshacer»: el formulario vacío y el índice como al empezar; la sección abierta sigue abierta.
  await barra(page).getByRole('button', { name: 'Deshacer' }).click();
  await expect(page.locator('#user-section-access')).toBeVisible();
  await expect(marcador(page, 'Acceso', 'actual')).toBeVisible();
  await expect(marcador(page, 'Identidad', 'pendiente')).toBeVisible();
  await expect(linea(page, 'Identidad')).toHaveText('Nombre, email');
  await expect(linea(page, 'Servicios asignados')).toHaveText('Sin revisar');
  await irASeccion(page, 'Identidad');
  await expect(page.locator('#user-name')).toHaveValue('');
});

test('editar · sin marcadores', async ({ page }) => {
  await goto(page, 'admin/usuarios/editar/1');
  await expect(indice(page).locator('.form-nav__item')).toHaveCount(3);
  await expect(indice(page).locator('sc-step-marker')).toHaveCount(0);
});
