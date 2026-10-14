import { expect, test } from '@playwright/test';
import { goto } from './helpers';

/**
 * Revisión de producto, listado de Agendas: sin Estado (activa o inactiva no aportaba: para una nueva se duplica una),
 * con los grupos en que se usa (la cifra, con su desplegable como en Tipificaciones) y la fecha de la última
 * modificación, que es lo que ayuda a saber de una agenda que cambia con el tiempo. «Duplicar» va junto a «Editar».
 */
test.use({ storageState: { cookies: [], origins: [] } });

const fila = (page: import('@playwright/test').Page, nombre: string) =>
  page.getByTestId('repo-table').locator('tbody tr', { hasText: nombre }).first();

test('Agendas: sin Estado, con Grupos y Modificada', async ({ page }) => {
  await goto(page, 'admin/agendas');
  const cabeceras = page.getByTestId('repo-table').locator('thead th');
  await expect(cabeceras.filter({ hasText: 'Estado' })).toHaveCount(0);
  await expect(cabeceras.filter({ hasText: 'Creación' })).toHaveCount(0);
  await expect(cabeceras.filter({ hasText: 'Grupos' })).toHaveCount(1);
  await expect(cabeceras.filter({ hasText: 'Modificada' })).toHaveCount(1);
  // «Ventas Nacional» la tienen puesta varios grupos, y su última modificación es la de los datos de ejemplo.
  await expect(fila(page, 'Ventas Nacional')).toContainText('2 oct 2026');
  await expect(fila(page, 'Ventas Nacional').locator('sc-group-popover')).toBeVisible();
});

test('Agendas: «Duplicar» crea la copia con su nombre, sin salir de la lista', async ({ page }) => {
  await goto(page, 'admin/agendas');
  await fila(page, 'Soporte Premium').getByLabel('Más acciones').click();
  await page.getByRole('menuitem', { name: 'Duplicar' }).click();
  await expect(fila(page, 'Soporte Premium (copia)')).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/agendas$/);
});
