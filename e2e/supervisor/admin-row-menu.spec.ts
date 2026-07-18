import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * Menú de fila de las listas admin tras la Ola 2.
 *
 * Antes, cada lista tenía DOS implementaciones que ya divergían: un panel HTML
 * inline por fila y, aparte, un menú contextual con sus propios handlers. Ahora
 * las dos las sirve el mismo `<p-menu>` compartido, y esto lo fija:
 *
 *  - el kebab lo abre (y el kebab EXISTE, que es lo que hace descubrible al menú);
 *  - el click derecho abre EXACTAMENTE el mismo menú (R3);
 *  - un solo clic aplica la acción — el bug que reaparece si el modelo del menú
 *    se recrea en cada ciclo de detección de cambios;
 *  - el borrado que lleva a la puerta tecleada se anuncia con puntos suspensivos
 *    (C4), y el que no, no.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const MENU_ITEM = '.p-menu-overlay .p-menu-item-link';

test('usuarios · el kebab abre el menú compartido y un solo clic aplica', async ({ page }) => {
  await goto(page, 'admin/usuarios');

  const row = page.locator('tbody tr').first();
  await row.locator('.rules-kebab-btn').click();

  const items = page.locator(MENU_ITEM);
  await expect(items).toHaveText([/editar/i, /duplicar/i, /eliminar/i]);

  // Un solo clic: si el modelo se recreara por ciclo de CD, aquí harían falta dos.
  await items.filter({ hasText: /editar/i }).click();
  await expect(page).toHaveURL(/\/admin\/usuarios\/editar\/\d+$/);
});

test('usuarios · el click derecho abre el MISMO menú que el kebab', async ({ page }) => {
  await goto(page, 'admin/usuarios');

  const row = page.locator('tbody tr').first();
  const items = page.locator(MENU_ITEM);

  // El overlay se monta de forma asíncrona: hay que esperarlo con `expect`
  // (auto-retry) antes de leerlo, o se lee vacío y el test miente.
  await row.locator('.rules-kebab-btn').click();
  await expect(items.first()).toBeVisible();
  const fromKebab = await items.allInnerTexts();

  // Cerrar el overlay ANTES de abrir el siguiente: si no, se mide el viejo.
  // Con Escape, no clicando "fuera": la esquina superior izquierda es el
  // skip-link, y clicarla navega y se lleva la tabla por delante.
  await page.keyboard.press('Escape');
  await expect(items).toHaveCount(0);

  await row.click({ button: 'right' });
  await expect(items.first()).toBeVisible();
  const fromRightClick = await items.allInnerTexts();

  expect(fromKebab).not.toEqual([]);
  expect(fromRightClick).toEqual(fromKebab);
  // Y hay UN solo menú montado, no uno por fila.
  await expect(page.locator('p-menu')).toHaveCount(1);
});

test('el borrado avisa con puntos suspensivos solo si lleva a la puerta tecleada', async ({
  page,
}) => {
  // Usuarios borra con `sc-delete-entity-dialog` (hay que teclear el nombre).
  await goto(page, 'admin/usuarios');
  await page.locator('tbody tr').first().locator('.rules-kebab-btn').click();
  await expect(page.locator(MENU_ITEM).filter({ hasText: /eliminar/i })).toHaveText(/…$/);
  await page.keyboard.press('Escape');

  // Categorías borra con una confirmación simple: sin puntos suspensivos.
  await goto(page, 'conversaciones/categorias');
  await page.locator('tbody tr').first().locator('.rules-kebab-btn').click();
  await expect(page.locator(MENU_ITEM).filter({ hasText: /eliminar/i })).not.toHaveText(/…$/);
});
