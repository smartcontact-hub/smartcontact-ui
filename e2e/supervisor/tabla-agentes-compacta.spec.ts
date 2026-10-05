import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA TABLA DE AGENTES DE LA FICHA DE GRUPO, COMPACTA Y SIN PAGINAR (DD-171).
 *
 * Medido el 2026-10-05 a 1440, en el grupo 11 (tres canales): la tabla medía 912 en una caja de 731 y desplazaba 181 px
 * de lado. El hueco estaba en las columnas de casillas: todas a 104 o 100, para rótulos de 32 a 72 y una casilla de 16.
 * Y paginaba de 10 en 10 (DD-151, sin un porqué), cuando la tabla ya desplaza por dentro con la cabecera fija y llega
 * al pie de la pantalla (DD-160). Lo que fija:
 *   1. A 1440, con tres canales y sin niveles, la tabla cabe en su caja: no desplaza de lado.
 *   2. Cada columna de casillas mide su rótulo: Chat y Email, más estrechas que Teléfono.
 *   3. Sin paginación: están todas las filas del filtro, y lo que no cabe lo desplaza la tabla por dentro.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('a 1440, con tres canales, la tabla de agentes cabe sin desplazar de lado', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const caja = page.locator('sc-agent-channel-table .p-datatable-table-container');
  await caja.locator('tbody tr').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  const m = await caja.evaluate((c) => ({ caja: c.clientWidth, tabla: c.scrollWidth }));
  expect(m.tabla, `la tabla (${m.tabla}) cabe en su caja (${m.caja})`).toBeLessThanOrEqual(m.caja);
});

test('cada columna de casillas mide su rótulo', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  await page.locator('sc-agent-channel-table tbody tr').first().waitFor();
  const anchos = await page.locator('sc-agent-channel-table thead th').evaluateAll((ths) =>
    Object.fromEntries(ths.map((th) => [th.getAttribute('aria-label') ?? '', Math.round(th.getBoundingClientRect().width)])),
  );
  expect(anchos['Chat']!, 'Chat, más estrecha que Teléfono').toBeLessThan(anchos['Teléfono']!);
  expect(anchos['Email']!, 'Email, más estrecha que Teléfono').toBeLessThan(anchos['Teléfono']!);
});

test('sin paginación: todas las filas del filtro, y la tabla desplaza por dentro', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  const tabla = page.locator('sc-agent-channel-table');
  await tabla.locator('tbody tr').first().waitFor();
  await expect(tabla.locator('.p-paginator')).toHaveCount(0);
  // Asignados: los 13 del grupo, todos en la tabla.
  await expect(tabla.locator('tbody tr')).toHaveCount(13);
  // Todos: los de la lista entera, también sin páginas.
  await tabla.getByRole('button', { name: 'Todos' }).click();
  await expect.poll(() => tabla.locator('tbody tr').count()).toBeGreaterThan(13);
});
