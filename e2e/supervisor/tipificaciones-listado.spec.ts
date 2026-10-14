import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * TIPIFICACIONES: EL LISTADO Y LA POSTCONVERSACIÓN DEL GRUPO (DD-187, que enmienda DD-173).
 *
 * Desde la revisión del 2026-10-09 una tipificación es nombre, descripción y árbol, y cada grupo elige la suya en su
 * General › Postconversación. Lo que fija:
 *   1. el listado de Repositorios tiene nombre, descripción, niveles y grupos, ordenables, y el ID como columna opcional;
 *   2. importar y descargar van detrás de UN icono, con su menú: el botón suelto de exportar no sale;
 *   3. importar dice antes qué entra, cada línea con error y las que ya existen, y lo que entra se crea;
 *   4. el grupo elige UNA tipificación, ve su árbol sin salir y, si tipifica, no guarda sin ella.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const filas = (page: Page) => page.getByTestId('tipificaciones-table').locator('tbody > tr');
const fila = (page: Page, nombre: string) => filas(page).filter({ hasText: nombre });

test('el listado tiene nombre, descripción, niveles y grupos, y el ID es opcional', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  const cabecera = page.getByTestId('tipificaciones-table').locator('thead');
  for (const columna of ['Nombre', 'Descripción', 'Niveles', 'Grupos']) await expect(cabecera).toContainText(columna);
  for (const fuera of ['Dirección', 'Comentarios', 'ID']) await expect(cabecera.getByText(fuera, { exact: true })).toHaveCount(0);
  await expect(fila(page, 'Atención al cliente')).toContainText('3 niveles');
  await expect(fila(page, 'Encuesta de calidad')).toContainText('1 nivel');
});

test('las columnas ordenan: por niveles, primero la de uno', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  await page.getByTestId('tipificaciones-table').locator('thead').getByText('Niveles', { exact: true }).click();
  await expect(filas(page).first()).toContainText('Encuesta de calidad');
  await expect(filas(page).last()).toContainText('Atención al cliente');
});

test('importar, exportar y descargar la plantilla van detrás de un solo botón «Acciones», con su menú', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  await expect(page.getByRole('button', { name: 'Exportar', exact: true })).toHaveCount(0);
  const icono = page.getByRole('button', { name: 'Acciones', exact: true });
  await expect(icono).toHaveAttribute('aria-haspopup', 'menu');
  await icono.click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem')).toContainText(['Importar tipificaciones', 'Exportar tipificaciones', 'Descargar plantilla CSV']);

  const descarga = page.waitForEvent('download');
  await menu.getByRole('menuitem', { name: /^Exportar tipificaciones/ }).click();
  expect((await descarga).suggestedFilename()).toMatch(/^tipificaciones.*\.xlsx$/);
});

test('«Exportar» cuenta la selección o la búsqueda, y se apaga si no hay filas', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  const acciones = page.getByRole('button', { name: 'Acciones', exact: true });
  await acciones.click();
  await expect(page.getByRole('menuitem', { name: /Exportar tipificaciones/ })).toContainText('Descarga el listado completo');
  await page.keyboard.press('Escape');

  await page.getByRole('row', { name: /Atención al cliente/ }).getByRole('checkbox').check();
  await acciones.click();
  const exportar = page.getByRole('menuitem', { name: /Exportar selección \(1\)/ });
  await expect(exportar).toContainText('Descarga solo los registros seleccionados');
  await page.keyboard.press('Escape');

  await page.getByPlaceholder(/Buscar tipificación/).fill('zzzz');
  await acciones.click();
  const sinFilas = page.getByRole('menuitem', { name: /Exportar/ });
  await expect(sinFilas).toContainText('No hay registros para exportar');
  await expect(sinFilas).toHaveAttribute('aria-disabled', 'true');
});

test('importar: la vista previa dice qué entra, cada error con su línea y las que ya existen', async ({ page }) => {
  await goto(page, 'admin/tipificaciones');
  await page.getByRole('button', { name: 'Acciones', exact: true }).click();
  await page.getByRole('menuitem', { name: /^Importar tipificaciones/ }).click();
  const dialogo = page.getByRole('dialog', { name: 'Importar tipificaciones' });
  const plantilla = page.waitForEvent('download');
  await dialogo.getByRole('button', { name: 'Descargar plantilla' }).click();
  expect((await plantilla).suggestedFilename()).toMatch(/\.csv$/);

  const csv = [
    'nombre;descripción;nivel 1;nivel 2;nivel 3',
    'Postventa;Tras la entrega;Entrega;A tiempo;',
    'Postventa;;Entrega;Con retraso;',
    'Mala;;A;;C',
    'Ventas salientes;;A;B;',
  ].join('\n');
  await dialogo.locator('input[type="file"]').setInputFiles({ name: 't.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf8') });
  await expect(dialogo).toContainText('Se creará 1 tipificación');
  await expect(dialogo).toContainText('Línea 4: falta un nivel entre dos que sí están');
  await expect(dialogo).toContainText('1 ya existe con ese nombre y no se crea.');

  await dialogo.getByRole('button', { name: 'Crear 1 tipificación' }).click();
  await expect(dialogo).toBeHidden();
  await expect(fila(page, 'Postventa')).toContainText('2 niveles');
});

test('el grupo elige una tipificación, ve su árbol sin salir y, si tipifica, no guarda sin ella', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=general');
  await expect(page.locator('sc-select:has(#group-typification)')).toContainText('Atención al cliente');
  await page.getByRole('button', { name: 'Ver qué tiene «Atención al cliente»' }).click();
  const arbol = page.getByRole('dialog', { name: 'Atención al cliente' });
  await expect(arbol).toContainText('Consulta');
  await expect(arbol.getByRole('link', { name: 'Editar en Repositorios' })).toHaveAttribute(
    'href',
    '/admin/tipificaciones/editar/1?seccion=categorias',
  );
  await page.keyboard.press('Escape');

  // Un grupo que no tipifica: al encenderlo, pide cuál y no deja guardar sin ella. Lo pide sin acusar (DD-199): el
  // aviso en rojo, al dejar General sin elegirla (`sin-acusar-de-primeras.spec.ts`).
  await goto(page, 'admin/grupos/editar/1?seccion=general');
  await page.getByRole('switch', { name: /^Tipificar/ }).click();
  await expect(page.locator('#group-typification')).toBeVisible();
  await expect(page.locator('sc-top-bar')).toContainText('tipificación');
  await expect(page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' })).toBeDisabled();
});
