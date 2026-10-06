import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * TIPIFICACIONES: EL LISTADO Y LA FICHA DE GRUPO (DD-173).
 *
 * La propuesta de producto del 2026-10-05: una tipificación es un árbol de hasta tres niveles, con su dirección, su
 * comentario y sus grupos. Lo que fija:
 *   1. el listado de Repositorios tiene las columnas de la propuesta (nombre, descripción, dirección, comentarios,
 *      niveles y grupos), todas ordenables, y el ID como columna opcional;
 *   2. importar y descargar van detrás de UN icono, con su menú: el botón suelto de exportar no sale;
 *   3. importar dice antes qué entra, cada línea con error y las que ya existen, y lo que entra se crea;
 *   4. la ficha de grupo elige VARIAS tipificaciones, y no deja dos que cubran lo mismo (dirección y canal).
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const filas = (page: Page) => page.getByTestId('tipificaciones-table').locator('tbody > tr');
const fila = (page: Page, nombre: string) => filas(page).filter({ hasText: nombre });

test('el listado tiene las columnas de la propuesta y el ID es opcional', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  const cabecera = page.getByTestId('tipificaciones-table').locator('thead');
  for (const columna of ['Nombre', 'Descripción', 'Dirección', 'Comentarios', 'Niveles', 'Grupos']) {
    await expect(cabecera).toContainText(columna);
  }
  await expect(cabecera.getByText('ID', { exact: true })).toHaveCount(0);

  const atencion = fila(page, 'Atención al cliente');
  await expect(atencion).toContainText('Entrantes');
  await expect(atencion).toContainText('3 niveles');
  await expect(fila(page, 'Cierre de chat')).toContainText('Solo comentario');
  await expect(fila(page, 'Soporte técnico')).toContainText('Ambas');
});

test('las columnas ordenan: por niveles, primero la que solo pide comentario', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  await page.getByTestId('tipificaciones-table').locator('thead').getByText('Niveles', { exact: true }).click();
  await expect(filas(page).first()).toContainText('Cierre de chat');
  await expect(filas(page).last()).toContainText('Atención al cliente');
});

test('importar y descargar van detrás de un solo icono, con su menú', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  await expect(page.getByRole('button', { name: 'Exportar', exact: true })).toHaveCount(0);
  const icono = page.getByRole('button', { name: 'Importar o descargar' });
  await expect(icono).toHaveAttribute('aria-haspopup', 'menu');
  await icono.click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem')).toHaveText(['Importar…', 'Descargar']);

  const descarga = page.waitForEvent('download');
  await menu.getByRole('menuitem', { name: 'Descargar' }).click();
  expect((await descarga).suggestedFilename()).toMatch(/^tipificaciones.*\.xlsx$/);
});

test('importar: la vista previa dice qué entra, cada error con su línea y las que ya existen', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  await page.getByRole('button', { name: 'Importar o descargar' }).click();
  await page.getByRole('menuitem', { name: 'Importar…' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Importar tipificaciones' });
  const plantilla = page.waitForEvent('download');
  await dialogo.getByRole('button', { name: 'Descargar plantilla' }).click();
  expect((await plantilla).suggestedFilename()).toMatch(/\.csv$/);

  const csv = [
    'nombre;descripción;dirección;comentarios;nivel 1;nivel 2;nivel 3',
    'Postventa;Tras la entrega;Salientes;Sí;Entrega;A tiempo;',
    'Postventa;;;;Entrega;Con retraso;',
    'Mala;;Lateral;sí;A;;',
    'Ventas salientes;;Salientes;sí;A;B;',
  ].join('\n');
  await dialogo.locator('input[type="file"]').setInputFiles({ name: 't.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf8') });
  await expect(dialogo).toContainText('Se creará 1 tipificación');
  await expect(dialogo).toContainText('Línea 4: la dirección no es Entrantes, Salientes ni Ambas');
  await expect(dialogo).toContainText('1 ya existe con ese nombre y no se crea.');

  await dialogo.getByRole('button', { name: 'Crear 1 tipificación' }).click();
  await expect(dialogo).toBeHidden();
  await expect(fila(page, 'Postventa')).toContainText('Salientes');
  await expect(fila(page, 'Postventa')).toContainText('2 niveles');
});

test('la ficha de grupo elige varias tipificaciones y no deja dos que cubran lo mismo', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=recursos');
  const campo = page.locator('sc-multiselect').filter({ has: page.locator('#group-typification') });
  await expect(campo).toContainText('2 tipificaciones');
  const filasRecurso = page.locator('sc-resource-rows').first();
  await expect(filasRecurso).toContainText('Atención al cliente');
  await expect(filasRecurso).toContainText('Entrantes · 3 niveles');
  await expect(filasRecurso).toContainText('Encuesta de calidad');

  // «Cierre de chat» también es de entrantes: con los canales del grupo choca con «Atención al cliente».
  await page.locator('sc-multiselect:has(#group-typification) .p-multiselect').click();
  await page.locator('.p-multiselect-overlay .p-multiselect-option').filter({ hasText: 'Cierre de chat' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#group-typification-msg, sc-multiselect .sc-field-msg').first()).toContainText('el agente no sabría cuál le toca');
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' })).toBeDisabled();
});
