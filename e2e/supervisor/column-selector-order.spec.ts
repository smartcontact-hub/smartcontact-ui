import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * UNA COLUMNA QUE VUELVES A MOSTRAR VUELVE A SU SITIO.
 *
 * `sc-column-selector` hacía `push` al reactivar una columna: ocultar «Canales» y volver a mostrarla la
 * mandaba al final de la tabla, y la tabla dejaba de estar como la tenías (hand-off del DS, 2026-09-14).
 * Ahora va detrás de la visible que la precede en la declaración. Se mide en Agentes, que es donde se usa.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const cabeceras = (page: Page) =>
  page.locator('sc-datatable thead th').evaluateAll((ths) =>
    ths.map((th) => (th.textContent ?? '').trim()).filter((t) => t.length > 0),
  );

test('Agentes · ocultar «Canales» y volver a mostrarla la deja donde estaba', async ({ page }) => {
  await goto(page, 'admin/agentes');
  const antes = await cabeceras(page);
  expect(antes.indexOf('Canales'), 'la prueba necesita «Canales» en medio de la tabla').toBeGreaterThan(0);
  expect(antes.indexOf('Canales'), 'si «Canales» ya es la última, no mide nada').toBeLessThan(antes.length - 1);

  await page.getByRole('button', { name: 'Columnas' }).click();
  const canales = page.locator('.sc-column-popover').getByRole('checkbox', { name: 'Canales' });
  await canales.uncheck();
  await expect.poll(() => cabeceras(page)).not.toContain('Canales');
  await canales.check();

  await expect.poll(() => cabeceras(page)).toEqual(antes);
});
