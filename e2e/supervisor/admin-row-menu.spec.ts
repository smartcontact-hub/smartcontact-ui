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
  // «Editar» abre la ficha por su primera sección, sin `?seccion=` (DD-213).
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
  // Y hay UN solo menú de fila montado, no uno por fila. Dentro del contenido de la página: el de «Acciones», en la
  // barra de la lista, es otro, y el del avatar vive en la barra de arriba.
  await expect(page.locator('main#main-content p-menu:not(.page__tools > p-menu)')).toHaveCount(1);
});

test('el borrado no lleva puntos suspensivos: todas las listas confirman sin teclear el nombre', async ({ page }) => {
  // Usuarios y Categorías confirman con la pregunta simple del DS (DD-215, DD-233): ninguna lleva a una puerta tecleada.
  for (const ruta of ['admin/usuarios', 'conversaciones/categorias']) {
    await goto(page, ruta);
    await page.locator('tbody tr').first().locator('.rules-kebab-btn').click();
    await expect(page.locator(MENU_ITEM).filter({ hasText: /eliminar/i })).not.toHaveText(/…$/);
    await page.keyboard.press('Escape');
  }
});
