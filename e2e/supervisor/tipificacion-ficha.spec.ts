import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA FICHA DE UNA TIPIFICACIÓN: EL ÁRBOL ENTERO A LA VISTA (DD-187, que enmienda DD-174).
 *
 * La revisión de agentes y tipificaciones del 2026-10-09: una tipificación es nombre, descripción y árbol, y el árbol se
 * ve entero en tres columnas. Lo que fija:
 *   1. el nombre encima del índice, con General y Categorías, y debajo cuántos niveles y en cuántos grupos;
 *   2. dos formas de añadir que no se confunden: «Añadir categoría», en la esquina de la sección, pone la primera del
 *      primer nivel; la flecha de una fila pone la primera de la columna de al lado, debajo de esa opción;
 *   3. un nombre repetido entre hermanas se dice bajo el árbol y no deja guardar; completo, no hay línea;
 *   4. el teléfono de la vista previa no cambia de tamaño al elegir;
 *   5. eliminarla dice qué grupos la usan, y al eliminarla esos grupos dejan de tipificar;
 *   6. un alta de punta a punta: nombre, opciones y Crear, y sale en el listado.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const barra = (page: Page) => page.locator('sc-top-bar');
const campos = (page: Page) => page.locator('sc-tipificacion-niveles .opcion input');
const primerNivel = (page: Page) => page.locator('sc-tipificacion-niveles .arbol__rama > .rama > .opcion input');

test('el molde de las fichas: el nombre encima del índice, con sus dos secciones', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1');
  const carril = page.locator('.page__rail');
  await expect(carril.getByRole('heading', { level: 1 })).toHaveText('Atención al cliente');
  await expect(carril).toContainText('3 niveles, en 4 grupos');
  await expect(carril.locator('sc-form-section-nav')).toContainText('General');
  await expect(carril.locator('sc-form-section-nav')).toContainText('Categorías');
});

test('«Añadir categoría» pone la primera del primer nivel; la flecha de una fila, la primera debajo de ella', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1?seccion=categorias');
  await expect(primerNivel(page)).toHaveCount(3);

  await page.locator('#tip-section-categorias .section-card__actions').getByRole('button', { name: 'Añadir categoría' }).click();
  await expect(primerNivel(page)).toHaveCount(4);
  await expect(primerNivel(page).first()).toBeFocused();
  await page.keyboard.type('Ventas');
  await expect(primerNivel(page).first()).toHaveValue('Ventas');

  await page.getByRole('button', { name: 'Añadir subcategoría a «Consulta»' }).click();
  const consulta = page.locator('sc-tipificacion-niveles .arbol__rama').filter({ has: page.getByRole('textbox', { name: 'Primer nivel: Consulta' }) });
  // Solo sus hijas directas (el segundo nivel), no las nietas.
  const segundo = consulta.locator(':scope > .rama > .rama__hijas > .rama > .opcion input');
  await expect(segundo.first()).toBeFocused();
  await page.keyboard.type('Cobros');
  await expect(segundo).toHaveCount(3);
  await expect(segundo.first()).toHaveValue('Cobros');
});

test('un nombre repetido entre hermanas se dice bajo el árbol y no deja guardar; completo, no hay línea', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1?seccion=categorias');
  await expect(page.locator('.niveles__estado')).toHaveCount(0);

  await primerNivel(page).nth(2).fill('consulta');
  await expect(page.locator('.niveles__estado')).toHaveText(/Hay opciones con el mismo nombre en una misma lista/);
  await expect(barra(page)).toContainText('Falta: un nombre distinto en cada opción');
  await expect(barra(page).getByRole('button', { name: 'Guardar' })).toBeDisabled();

  await primerNivel(page).nth(2).fill('Gestión');
  await expect(page.locator('.niveles__estado')).toHaveCount(0);
});

test('el teléfono de la vista previa no cambia de tamaño al elegir', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1?seccion=categorias');
  const telefono = page.locator('sc-tipificacion-vista .tel');
  const antes = (await telefono.boundingBox())!;
  await page.locator('sc-tipificacion-vista .tel__nivel').first().click();
  await page.getByRole('option', { name: 'Consulta' }).click();
  await expect(page.locator('sc-tipificacion-vista .tel__nivel').first()).toContainText('Consulta');
  const despues = (await telefono.boundingBox())!;
  expect([despues.width, despues.height]).toEqual([antes.width, antes.height]);
});

test('eliminarla dice qué grupos la usan, y esos grupos dejan de tipificar', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1');
  await page.locator('.page__rail').getByRole('button', { name: 'Eliminar' }).click();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toContainText(
    'La usan 4 grupos: ACD demo cuscare, Grupo pedidos, Online Support y Reclamaciones. Al eliminarla, dejan de tipificar hasta que elijas otra.',
  );
  await dialogo.getByRole('textbox').fill('Atención al cliente');
  await dialogo.getByRole('button', { name: 'Eliminar' }).click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones$/);

  await goto(page, 'admin/grupos/editar/2?seccion=general');
  await expect(page.getByRole('switch', { name: /Tipificar/ })).not.toBeChecked();
});

test('un alta de punta a punta: nombre, opciones y Crear, y sale en el listado', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/crear');
  await expect(barra(page)).toContainText('Falta: nombre, al menos una opción');
  await page.locator('#tip-name').fill('Seguimiento de pedido');
  await page.locator('sc-form-section-nav').getByText('Categorías').click();
  await page.getByRole('button', { name: 'Añadir categoría' }).click();
  // Enter abre la siguiente justo detrás, con el foco: se escribe en cuanto lo tiene, y Enter va cuando el nombre ya
  // está en el campo (en el CI, más lento, llegaba antes y no abría la siguiente).
  for (const [i, opcion] of ['Entregado', 'En reparto', 'Retrasado'].entries()) {
    const campo = campos(page).nth(i);
    await expect(campo).toBeFocused();
    await campo.fill(opcion);
    // El nombre ya está en el árbol, no solo en el campo: su nombre accesible lo repite.
    await expect(campo).toHaveAttribute('aria-label', `Primer nivel: ${opcion}`);
    if (i < 2) await campo.press('Enter');
  }
  await expect(campos(page)).toHaveCount(3);
  await expect.poll(() => campos(page).evaluateAll((es) => es.map((e) => (e as HTMLInputElement).value))).toEqual([
    'Entregado',
    'En reparto',
    'Retrasado',
  ]);

  await barra(page).getByRole('button', { name: 'Crear tipificación' }).click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones\/editar\/\d+/);
  await goto(page, 'admin/tipificaciones');
  await expect(
    page.getByTestId('tipificaciones-table').locator('tbody > tr').filter({ hasText: 'Seguimiento de pedido' }),
  ).toContainText('1 nivel');
});
