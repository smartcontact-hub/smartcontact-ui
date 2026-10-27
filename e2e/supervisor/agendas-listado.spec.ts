import { expect, test } from '@playwright/test';
import { goto } from './helpers';

/**
 * Revisión de producto, listado de Agendas (COA SISMAC-4440): sin Estado (activa o inactiva no aportaba: para una nueva
 * se duplica una), con la descripción, los contactos, los agentes a los que se asigna (la cifra, sin globo con nombres:
 * solo se asigna a agentes) y la fecha de la última modificación, que es lo que ayuda a saber de una agenda que cambia
 * con el tiempo. «Duplicar» va junto a «Editar».
 */
test.use({ storageState: { cookies: [], origins: [] } });

const fila = (page: import('@playwright/test').Page, nombre: string) =>
  page.getByTestId('repo-table').locator('tbody tr', { hasText: nombre }).first();

test('Agendas: sin Estado, con Descripción, Agentes y Modificada', async ({ page }) => {
  await goto(page, 'admin/agendas');
  const cabeceras = page.getByTestId('repo-table').locator('thead th');
  await expect(cabeceras.filter({ hasText: 'Estado' })).toHaveCount(0);
  await expect(cabeceras.filter({ hasText: 'Creación' })).toHaveCount(0);
  await expect(cabeceras.filter({ hasText: 'Grupos' })).toHaveCount(0);
  await expect(cabeceras.filter({ hasText: 'Descripción' })).toHaveCount(1);
  await expect(cabeceras.filter({ hasText: 'Agentes' })).toHaveCount(1);
  await expect(cabeceras.filter({ hasText: 'Modificada' })).toHaveCount(1);
  // «Ventas Nacional» la tienen varios agentes, y su última modificación es la de los datos de ejemplo.
  await expect(fila(page, 'Ventas Nacional')).toContainText('2 oct 2026');
  await expect(fila(page, 'Ventas Nacional').locator('sc-group-popover')).toHaveCount(0);
});

test('Agendas: «Duplicar» abre «Nueva agenda» con la copia («X (1)»), que no existe hasta pulsar «Crear» (DD-234)', async ({ page }) => {
  await goto(page, 'admin/agendas');
  await fila(page, 'Soporte Premium').getByLabel('Más acciones').click();
  await page.getByRole('menuitem', { name: 'Duplicar' }).click();
  await expect(page).toHaveURL(/\/admin\/agendas\/crear\?seedFromId=\d+$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Soporte Premium (1)');
  await expect(page.locator('#agenda-name')).toHaveValue('Soporte Premium (1)');
  // Con los contactos del original, y todavía sin crear.
  await expect(page.locator('sc-agenda-contacts-table .p-datatable-tbody > tr')).not.toHaveCount(0);
  const guardadas = () => page.evaluate(() => (JSON.parse(localStorage.getItem('sc-agendas-repo') ?? '[]') as { name: string }[]).map((a) => a.name));
  expect(await guardadas()).not.toContain('Soporte Premium (1)');
  // Salir sin tocar nada no pregunta.
  await page.getByRole('link', { name: 'Agendas', exact: true }).first().click();
  await expect(page).toHaveURL(/\/admin\/agendas$/);
  await expect(page.getByRole('alertdialog', { name: '¿Descartar cambios?' })).toHaveCount(0);
  expect(await guardadas()).not.toContain('Soporte Premium (1)');

  // Crear la copia: existe, y duplicar la copia da «(2)», no «(1) (1)».
  await fila(page, 'Soporte Premium').getByLabel('Más acciones').click();
  await page.getByRole('menuitem', { name: 'Duplicar' }).click();
  await page.locator('sc-top-bar').getByRole('button', { name: 'Crear agenda' }).click();
  await expect(page).toHaveURL(/\/admin\/agendas\/editar\/\d+$/);
  expect(await guardadas()).toContain('Soporte Premium (1)');
  // El aviso lo dice el COA: «Agenda «X (1)» creada», no el genérico «creado/a».
  await expect(page.getByText('Agenda «Soporte Premium (1)» creada')).toBeVisible();
});

test('Agendas: eliminar avisa «Agenda «X» eliminada» y varias a la vez, «2 agendas eliminadas» (COA SISMAC-4440)', async ({ page }) => {
  await goto(page, 'admin/agendas');
  await fila(page, 'Soporte Premium').getByLabel('Más acciones').click();
  await page.getByRole('menuitem', { name: 'Eliminar' }).click();
  await page.getByRole('alertdialog', { name: '¿Eliminar la agenda «Soporte Premium»?' }).getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.getByText('Agenda «Soporte Premium» eliminada')).toBeVisible();

  await fila(page, 'Ventas Nacional').getByRole('checkbox').check();
  await page.getByTestId('repo-table').locator('tbody tr').nth(1).getByRole('checkbox').check();
  await fila(page, 'Ventas Nacional').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Eliminar (2)' }).click();
  const aviso = page.getByRole('alertdialog', { name: '¿Eliminar 2 agendas?' });
  await expect(aviso).toContainText('Esta acción no se puede deshacer.');
  await aviso.getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.getByText('2 agendas eliminadas')).toBeVisible();
});
