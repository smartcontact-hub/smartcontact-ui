import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA FICHA DE UNA TIPIFICACIÓN, SIN SALTOS (DD-174).
 *
 * La revisión del 2026-10-05: el molde de las fichas con su índice, los niveles como columnas y ningún aviso que entre
 * empujando lo de debajo. Lo que fija:
 *   1. el nombre encima del índice (General, Categorías, Grupos), como las demás fichas (DD-170);
 *   2. elegir una opción enseña sus hijas en la columna de al lado;
 *   3. un nombre repetido y una rama a medias se dicen en sus líneas reservadas: ni las columnas ni la tarjeta se
 *      mueven, y Guardar dice lo que falta;
 *   4. las tres columnas existen siempre: quitar el último nivel pregunta, deja su columna fantasma y no cambia
 *      ningún ancho;
 *   5. renombrar se hace en la línea de la columna (Enter guarda);
 *   6. un choque en Grupos se dice encima de la tabla, sin alargar ninguna fila, y no deja guardar;
 *   7. un alta de punta a punta: nombre, opciones y Crear, y sale en el listado.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const columna = (page: Page, i: number) => page.locator('sc-tipificacion-niveles section.nivel').nth(i);
const linea = (page: Page, i: number) => page.locator(`#tip-linea-${i}`);
const barra = (page: Page) => page.locator('sc-top-bar');

/** Dónde está cada pieza que no debe moverse: x, y, ancho y alto, redondeados. */
const cajas = (page: Page, selector: string) =>
  page.evaluate(
    (s) =>
      [...document.querySelectorAll(s)].map((e) => {
        const r = e.getBoundingClientRect();
        return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
      }),
    selector,
  );
const foto = async (page: Page) => ({
  columnas: await cajas(page, 'sc-tipificacion-niveles .niveles > *'),
  estado: await cajas(page, '.niveles__estado'),
  tarjeta: await cajas(page, '.page__main sc-section-card'),
});

test('el molde de las fichas: el nombre encima del índice, con sus tres secciones', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1');
  const carril = page.locator('.page__rail');
  await expect(carril.getByRole('heading', { level: 1 })).toHaveText('Atención al cliente');
  await expect(carril).toContainText('Entrantes · 3 niveles');
  await expect(carril.locator('sc-form-section-nav')).toContainText('General');
  await expect(carril.locator('sc-form-section-nav')).toContainText('Categorías');
  await expect(carril.locator('sc-form-section-nav')).toContainText('Grupos');
});

test('elegir una opción enseña sus hijas en la columna de al lado', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1?seccion=categorias');
  await expect(columna(page, 1).getByRole('option')).toHaveText([/Facturación/, /Producto/]);
  await columna(page, 0).getByRole('option', { name: 'Reclamación' }).click();
  await expect(columna(page, 1).getByRole('option')).toHaveText([/Servicio/, /Facturación/]);
  await expect(columna(page, 2).getByRole('option')).toHaveText(['Retraso', 'Avería', 'Atención recibida']);
});

test('el repetido y la rama a medias se dicen en su línea: nada se mueve y Guardar dice lo que falta', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1?seccion=categorias');
  await expect(page.locator('.niveles__estado')).toContainText('Completa');
  const antes = await foto(page);

  await linea(page, 0).fill('gestión');
  await expect(columna(page, 0).locator('.nivel__mensaje')).toHaveText('Ya hay «Gestión» en este nivel');
  expect(await foto(page)).toEqual(antes);

  await linea(page, 0).fill('Ventas');
  await linea(page, 0).press('Enter');
  await expect(page.locator('.niveles__estado')).toContainText('Faltan opciones debajo de: Ventas');
  await expect(columna(page, 1).locator('.nivel__mensaje')).toHaveText('«Ventas» necesita opciones aquí');
  expect(await foto(page)).toEqual(antes);
  await expect(barra(page)).toContainText('Falta: opciones en todas las ramas');
  await expect(barra(page).getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('quitar el último nivel pregunta, deja su columna fantasma y no cambia ningún ancho', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1?seccion=categorias');
  await expect(columna(page, 2).getByRole('option')).toHaveCount(3);
  const antes = await foto(page);

  await page.getByRole('button', { name: 'Quitar el tercer nivel' }).click();
  const dialogo = page.getByRole('dialog', { name: '¿Quitar el tercer nivel?' });
  await expect(dialogo).toContainText('Se eliminan sus 20 opciones.');
  await dialogo.getByRole('button', { name: 'Quitar nivel' }).click();
  await expect(page.getByRole('button', { name: /Añadir tercer nivel/ })).toBeVisible();
  const despues = await foto(page);
  expect(despues.columnas.map(([x, , ancho]) => [x, ancho])).toEqual(antes.columnas.map(([x, , ancho]) => [x, ancho]));
  expect(despues.tarjeta).toEqual(antes.tarjeta);
  await expect(page.locator('.page__rail')).toContainText('Entrantes · 2 niveles');
});

test('renombrar se hace en la línea de la columna: Enter guarda el nombre nuevo', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1?seccion=categorias');
  await columna(page, 0).getByRole('option', { name: 'Reclamación' }).click();
  await columna(page, 0).getByRole('button', { name: 'Renombrar Reclamación' }).click();
  await expect(linea(page, 0)).toHaveValue('Reclamación');
  await linea(page, 0).fill('Reclamaciones');
  await linea(page, 0).press('Enter');
  await expect(columna(page, 0).getByRole('option')).toHaveText([/Consulta/, /Reclamaciones/, /Gestión/]);
  await expect(linea(page, 0)).toHaveValue('');
});

test('un choque en Grupos se dice encima de la tabla, sin alargar ninguna fila, y no deja guardar', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/5?seccion=grupos');
  const filas = page.locator('sc-tipificacion-grupos tbody > tr');
  await expect(filas).toHaveCount(1);
  const alto = (await filas.first().boundingBox())!.height;

  await page.locator('#tip-add-group').click();
  await page.getByRole('option', { name: 'Online Support' }).click();
  await expect(page.locator('.assign__estado')).toHaveText(
    'Online Support: Choca con «Atención al cliente» en las entrantes por Teléfono, Chat y Email',
  );
  await expect(filas).toHaveCount(2);
  for (const fila of await filas.all()) expect((await fila.boundingBox())!.height).toBe(alto);
  await expect(barra(page)).toContainText('Falta: grupos sin choques');
  await expect(barra(page).getByRole('button', { name: 'Guardar' })).toBeDisabled();
});

test('un alta de punta a punta: nombre, opciones y Crear, y sale en el listado', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/crear');
  await expect(barra(page)).toContainText('Falta: nombre · opciones en todas las ramas');
  await page.locator('#tip-name').fill('Seguimiento de pedido');
  await page.locator('sc-form-section-nav').getByText('Categorías').click();
  for (const opcion of ['Entregado', 'En reparto', 'Retrasado']) {
    await linea(page, 0).fill(opcion);
    await linea(page, 0).press('Enter');
  }
  await expect(columna(page, 0).getByRole('option')).toHaveText(['Entregado', 'En reparto', 'Retrasado']);
  await expect(page.locator('.niveles__estado')).toContainText('Completa: 3 opciones en un nivel.');

  await barra(page).getByRole('button', { name: 'Crear tipificación' }).click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones\/editar\/\d+/);
  await goto(page, 'admin/tipificaciones');
  await expect(page.getByTestId('tipificaciones-table').locator('tbody > tr').filter({ hasText: 'Seguimiento de pedido' })).toContainText('1 nivel');
});
