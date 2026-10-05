import { expect, test, type Locator } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA SELECCIÓN EN UNA LISTA SOBRE `sc-list-page` (DD-98), COMO YA LA HACÍA CONVERSACIONES.
 *
 * Medido el 2026-10-05 en Usuarios y Agentes, las dos sobre la pieza:
 *   - Mayús en la casilla, de la fila 1 a la 4, selecciona cuatro (la barra lo dice) y pinta dos: p-table solo resalta
 *     las filas que marca él, no las que añade el tramo;
 *   - Espacio en la fila enfocada no hacía nada;
 *   - Mayús+clic en una fila abría su ficha;
 *   - la casilla de «todas» no tenía nombre (WCAG 4.1.2), tampoco en Conversaciones: PrimeNG 22.1 lo calcula solo
 *     cuando la tabla recibe filas DESPUÉS de pintarse la cabecera.
 * Conversaciones, con su tabla propia, ya hacía las tres primeras (`conversations-row-gesture.spec.ts`). Se mide en
 * Usuarios: la pieza es la misma en las ocho listas.
 *
 * Las teclas van con `page.keyboard`: la acción `key` del navegador entrega `key` vacío (LEARNINGS #1).
 */

test.use({ storageState: { cookies: [], origins: [] } });

const TABLA = '[data-testid="users-table"]';
const FILAS = `${TABLA} .p-datatable-tbody > tr`;
const BARRA = 'sc-bulk-action-bar .bulk-bar';

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
  await goto(page, 'admin/usuarios');
  await expect(page.locator(FILAS).first()).toBeVisible();
});

const fondo = (fila: Locator): Promise<string> => fila.evaluate((tr) => getComputedStyle(tr).backgroundColor);

test('Mayús en la casilla pinta el tramo entero, no solo sus dos puntas', async ({ page }) => {
  const filas = page.locator(FILAS);
  await filas.nth(1).locator('p-table-checkbox').click();
  await filas.nth(4).locator('p-table-checkbox').click({ modifiers: ['Shift'] });
  await expect(page.locator(BARRA)).toContainText('4');
  // Fuera de las filas: el color de pasar el ratón no se confunde con el de seleccionada.
  await page.mouse.move(720, 8);

  const marcada = await fondo(filas.nth(1));
  // Control: una fila marcada se distingue de una sin marcar. Si no, comparar colores no diría nada.
  expect(marcada).not.toBe(await fondo(filas.nth(0)));
  for (const i of [2, 3, 4]) await expect.poll(() => fondo(filas.nth(i))).toBe(marcada);
});

test('Espacio en la fila enfocada la selecciona, sin abrirla', async ({ page }) => {
  const url = page.url();
  await page.locator(FILAS).first().focus();
  await page.keyboard.press(' ');

  await expect(page.locator(BARRA)).toContainText('1');
  expect(page.url()).toBe(url);
});

test('Mayús+clic en una fila no la abre', async ({ page }) => {
  const rutas: string[] = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) rutas.push(new URL(frame.url()).pathname);
  });
  const filas = page.locator(FILAS);

  await filas.nth(2).locator('td').nth(2).click({ modifiers: ['Shift'] });
  // Control: el clic sin Mayús, en OTRA fila, sí abre. Si el de Mayús hubiera abierto, la lista se iría (con la
  // transición de vista, al momento) y este clic no llegaría; y si llegara, habría dos fichas distintas en las rutas.
  await filas.nth(3).locator('td').nth(2).click({ timeout: 5_000 });
  await expect.poll(() => rutas.length).toBeGreaterThan(0);
  expect(new Set(rutas).size).toBe(1);
});

test('la casilla de «todas» tiene nombre desde que se pinta', async ({ page }) => {
  await expect(page.locator(TABLA).getByRole('checkbox', { name: 'Seleccionar todo' })).toHaveCount(1);
});
