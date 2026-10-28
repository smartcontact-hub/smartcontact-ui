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

test('«Añadir categoría» pone la primera del primer nivel; «Añadir subcategoría», la última debajo de la suya', async ({ page }) => {
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
  await expect(segundo.last()).toBeFocused();
  await page.keyboard.type('Cobros');
  await expect(segundo).toHaveCount(3);
  await expect(segundo.last()).toHaveValue('Cobros');
  // Uno por opción que puede tener hijas (Consulta y sus tres del segundo nivel; el tercero no), y ninguna flecha por fila.
  await expect(consulta.getByRole('button', { name: /^Añadir subcategoría a / })).toHaveCount(4);
  await expect(page.locator('sc-tipificacion-niveles sc-button[icon="subdirectory_arrow_right"]')).toHaveCount(0);
});

test('un nombre repetido entre hermanas se dice bajo el árbol y no deja guardar; completo, no hay línea', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1?seccion=categorias');
  await expect(page.locator('.niveles__estado')).toHaveCount(0);

  await primerNivel(page).nth(2).fill('consulta');
  await expect(page.locator('.niveles__estado')).toHaveText(/Hay opciones con el mismo nombre en una misma lista/);
  // Sin «Falta: …» en la barra; «Guardar» apagado mientras se repita (DD-219), y con Ctrl+S el índice lo dice.
  await expect(barra(page)).not.toContainText('Falta');
  await expect(barra(page).getByRole('button', { name: 'Guardar' })).toBeDisabled();
  await page.keyboard.press('ControlOrMeta+s');
  await expect(page.locator('sc-form-section-nav .form-nav__item--has-error')).toContainText('Dale a cada opción un nombre distinto');

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

test('eliminarla dice cuántos grupos la usan, y esos grupos dejan de tipificar', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/editar/1');
  await page.locator('.page__rail').getByRole('button', { name: 'Eliminar' }).click();
  const pregunta = page.getByRole('alertdialog', { name: '¿Eliminar la tipificación «Atención al cliente»?' });
  await expect(pregunta).toContainText('La usan 4 grupos.');
  await expect(pregunta.getByRole('textbox'), 'no pide escribir el nombre').toHaveCount(0);
  await pregunta.getByRole('button', { name: 'Eliminar' }).click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones$/);
  await expect(page.getByText('Tipificación «Atención al cliente» eliminada')).toBeVisible();

  await goto(page, 'admin/grupos/editar/2?seccion=general');
  await expect(page.getByRole('switch', { name: /Tipificar/ })).not.toBeChecked();
});

test('un nombre que ya existe se permite: ni aviso ni Crear apagado, y se crea (DD-235)', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/crear');
  await page.locator('#tip-name').fill('Atención al cliente');
  await page.locator('#tip-name').blur();
  await expect(page.locator('.sc-field__msg--error')).toHaveCount(0);
  await page.locator('sc-form-section-nav').getByText('Categorías').click();
  await page.getByRole('button', { name: 'Añadir categoría' }).click();
  await campos(page).first().fill('Una');
  const crear = barra(page).getByRole('button', { name: 'Crear tipificación' });
  await expect(crear).toBeEnabled();
  await crear.click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones\/editar\/\d+/);
});

test('un alta de punta a punta: nombre, opciones y Crear, y sale en el listado', async ({ page }) => {
  await goto(page, 'admin/tipificaciones/crear');
  // «Crear tipificación», apagado mientras falten el nombre o una opción (DD-219); el nombre lo dice en gris.
  const crear = barra(page).getByRole('button', { name: 'Crear tipificación' });
  await expect(crear).toBeDisabled();
  await expect(page.locator('sc-inputtext:has(#tip-name) .sc-field__msg:not(.sc-field__msg--error)')).toHaveText(
    'El nombre es obligatorio.',
  );
  await page.locator('#tip-name').fill('Seguimiento de pedido');
  await expect(crear).toBeDisabled();
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

  await expect(crear).toBeEnabled();
  await crear.click();
  await expect(page).toHaveURL(/\/admin\/tipificaciones\/editar\/\d+/);
  await goto(page, 'admin/tipificaciones');
  await expect(
    page.getByTestId('tipificaciones-table').locator('tbody > tr').filter({ hasText: 'Seguimiento de pedido' }),
  ).toContainText('1 nivel');
});
