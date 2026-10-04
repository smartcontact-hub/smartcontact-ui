import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA AGENDA ES UNA LISTA DE CONTACTOS, CON SU EDITOR (DD-163).
 *
 * La revisión de producto del 2026-10-04: una agenda es lo que el agente ve en la sección Agenda de su teléfono, cada
 * número con su nombre; se crea, se le dan de alta contactos, se cambian y se guardan. Hasta entonces era un texto con
 * números separados por comas, editado en un panel sobre la lista. Lo que fija:
 *   1. el listado dice cuántos contactos tiene cada agenda, y abrir una fila lleva a su editor;
 *   2. el editor añade (con el teléfono validado y sin repetir), edita y borra contactos, y Guardar los deja en la agenda;
 *   3. Atrás con cambios sin guardar avisa, y descartar no guarda;
 *   4. lo guardado antes como texto con comas se lee como contactos «Sin nombre», sin repetidos;
 *   5. la agenda grande se pinta por páginas y se busca.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const tabla = (page: Page) => page.locator('sc-agenda-contacts-table');
const filas = (page: Page) => tabla(page).locator('.p-datatable-tbody > tr');
interface AgendaGuardada {
  readonly id: number;
  readonly name: string;
  readonly contacts?: readonly { readonly name: string; readonly phone: string }[];
}
const guardadas = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('sc-agendas-repo') ?? '[]') as AgendaGuardada[]);

test('el listado dice cuántos contactos tiene cada agenda, y la fila abre su editor', async ({ page }) => {
  await goto(page, 'admin/agendas');
  const fila = page.locator('tbody tr', { hasText: 'Ventas Nacional' });
  await expect(fila).toContainText('3');
  await fila.locator('td').nth(1).click();
  await expect(page).toHaveURL(/\/admin\/agendas\/editar\/1$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ventas Nacional');
  await expect(filas(page)).toHaveCount(3);
  await expect(tabla(page)).toContainText('Centralita de ventas');
});

test('añadir un contacto valida el teléfono y no lo repite; guardar lo deja en la agenda', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/1');
  await page.getByRole('button', { name: 'Añadir contacto' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Añadir contacto' });
  await dialogo.getByLabel('Nombre').fill('Ventas al por mayor');
  await dialogo.getByLabel('Teléfono').fill('900 1OO 203');
  await dialogo.getByRole('button', { name: 'Crear' }).click();
  await expect(dialogo).toContainText('El teléfono no es válido');

  // El mismo número que «Centralita de ventas», escrito con guiones: se compara por sus cifras.
  await dialogo.getByLabel('Teléfono').fill('900-100-200');
  await dialogo.getByRole('button', { name: 'Crear' }).click();
  await expect(dialogo).toContainText('ya está en esta agenda');

  await dialogo.getByLabel('Teléfono').fill('900 100 203');
  await dialogo.getByRole('button', { name: 'Crear' }).click();
  await expect(dialogo).toBeHidden();
  await expect(filas(page)).toHaveCount(4);

  await page.locator('sc-top-bar').getByRole('button', { name: 'Guardar' }).click();
  await expect.poll(async () => (await guardadas(page)).find((a) => a.id === 1)?.contacts?.length).toBe(4);
});

test('editar y borrar un contacto desde su menú de fila', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/3');
  const fila = filas(page).filter({ hasText: 'Impagos' });
  await fila.getByRole('button', { name: 'Más acciones' }).click();
  await page.locator('.p-menu-overlay').getByRole('menuitem', { name: 'Editar' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Editar contacto' });
  await dialogo.getByLabel('Nombre').fill('Recobro de impagos');
  await dialogo.getByRole('button', { name: 'Guardar' }).click();
  await expect(tabla(page)).toContainText('Recobro de impagos');

  const otra = filas(page).filter({ hasText: 'Facturación' });
  await otra.getByRole('button', { name: 'Más acciones' }).click();
  await page.locator('.p-menu-overlay').getByRole('menuitem', { name: 'Eliminar' }).click();
  await expect(filas(page)).toHaveCount(3);
  await expect(tabla(page)).not.toContainText('Facturación');
});

test('Atrás con cambios sin guardar avisa; descartar no guarda', async ({ page }) => {
  await goto(page, 'admin/agendas');
  await page.locator('tbody tr', { hasText: 'Soporte Premium' }).locator('td').nth(1).click();
  await expect(page).toHaveURL(/\/admin\/agendas\/editar\/2$/);
  await page.locator('#agenda-name').fill('Soporte Premium Plus');

  const aviso = page.getByRole('alertdialog', { name: '¿Descartar cambios?' });
  await page.evaluate(() => history.back());
  await expect(aviso).toBeVisible();
  await aviso.getByRole('button', { name: 'Descartar' }).click();
  await expect(page).toHaveURL(/\/admin\/agendas$/);
  await expect(page.locator('tbody tr', { hasText: 'Soporte Premium Plus' })).toHaveCount(0);
});

test('crear una agenda: «Crear» del listado lleva al editor vacío, y al crearla se queda en su edición', async ({ page }) => {
  await goto(page, 'admin/agendas');
  await page.locator('sc-top-bar').getByRole('button', { name: 'Crear' }).click();
  await expect(page).toHaveURL(/\/admin\/agendas\/crear$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nueva agenda');
  await page.locator('#agenda-name').fill('Proveedores');
  await page.locator('sc-top-bar').getByRole('button', { name: 'Crear agenda' }).click();
  await expect(page).toHaveURL(/\/admin\/agendas\/editar\/\d+$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Proveedores');
  await expect.poll(async () => (await guardadas(page)).some((a) => a.name === 'Proveedores')).toBe(true);
});

test('lo guardado antes como texto con comas se lee como contactos sin nombre, sin repetidos', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sc-agendas-repo-v', '1');
    localStorage.setItem(
      'sc-agendas-repo',
      JSON.stringify([{ id: 1, name: 'Vieja', numbers: '900 100 200, 900-100-200, 900 100 201', description: '', status: 'active' }]),
    );
  });
  await goto(page, 'admin/agendas/editar/1');
  await expect(filas(page)).toHaveCount(2);
  await expect(filas(page).first()).toContainText('Sin nombre');
});

test('la agenda grande se pinta por páginas y se busca', async ({ page }) => {
  await goto(page, 'admin/agendas/editar/9');
  await expect(filas(page)).toHaveCount(10);
  await tabla(page).getByRole('searchbox').fill('0999');
  await expect(filas(page)).toHaveCount(1);
  await expect(filas(page)).toContainText('Punto de venta 0999');
});
