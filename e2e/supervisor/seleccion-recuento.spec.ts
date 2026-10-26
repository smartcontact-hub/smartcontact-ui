import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LA SELECCIÓN DICE CUÁNTOS DE CUÁNTOS (DD-176).
 *
 * Al marcar varias filas de un listado, la barra en lote decía «2 grupos seleccionados», sin el total de la lista. Ahora
 * dice «2/14 grupos seleccionados», y el lector oye «2 de 14»: «2/14» se puede leer como una fecha o una fracción.
 * Grupos, Agentes y las listas de administración ya no montan barra (DD-215, DD-227): se mide en Conversaciones.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

test('al marcar dos conversaciones, la barra dice 2 de las que tiene la lista', async ({ page }) => {
  await goto(page, 'conversaciones');
  const filas = page.locator('sc-list-page tbody tr');
  await filas.first().waitFor();
  await filas.nth(0).getByRole('checkbox').click();
  await filas.nth(1).getByRole('checkbox').click();
  const barra = page.getByRole('region', { name: 'Acciones en bloque' });
  // A la vista: «2/N … seleccionadas».
  await expect(barra.locator('.bulk-bar__count [aria-hidden="true"]')).toHaveText(/^2\/\d+$/);
  await expect(barra.locator('.bulk-bar__summary')).toContainText(/seleccionad/);
  // Lo que oye el lector: «2 de N», no «2/N».
  const oido = await barra.locator('.bulk-bar__count').evaluate((el) =>
    [...el.childNodes]
      .filter((n) => n.nodeType !== Node.COMMENT_NODE)
      .map((n) => ((n as Element).getAttribute?.('aria-hidden') === 'true' ? '' : n.textContent))
      .join('')
      .trim(),
  );
  expect(oido).toMatch(/^2 de \d+$/);
});
