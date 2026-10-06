import { expect, test, type Locator, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL CAJÓN MODAL SE LLEVA EL FOCO Y SE ANUNCIA COMO DIÁLOGO (`sc-drawer`, 2026-10-05).
 *
 * Medido en el panel de agentes, desde el listado de grupos y desde el Monitor: al abrirse, el foco se quedaba en el
 * botón que lo abría, FUERA del panel, y PrimeNG lo pinta como `complementary`. Escape no cerraba sin tabular antes
 * (su tecla la escucha el contenido del panel) y el lector seguía en la página de atrás. La vuelta del foco al cerrar
 * la hacía el panel a mano (DD-168); la vigilan `panel-agentes-grupo.spec.ts` y `panel-agentes-monitor.spec.ts`, y
 * aquí se comprueba también tras Escape.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const panel = (page: Page) => page.locator('.agents-panel');

/** El foco, dentro del panel abierto. */
const focoDentro = (page: Page): Promise<boolean> =>
  page.evaluate(() => !!document.activeElement?.closest('.agents-panel'));

const comprobar = async (page: Page, quienAbre: Locator, grupo: string): Promise<void> => {
  await expect(page.getByRole('dialog', { name: `Agentes: ${grupo}` })).toBeVisible();
  await expect.poll(() => focoDentro(page)).toBe(true);

  // Escape, sin tabular antes: cierra (sin cambios no pregunta) y el foco vuelve a quien lo abrió.
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await expect(quienAbre).toBeFocused();
};

test('desde el listado de grupos', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const cifra = page.getByRole('button', { name: 'Asignar agentes de Reclamaciones' });
  await cifra.click();
  await expect(panel(page)).toBeVisible();
  await comprobar(page, cifra, 'Reclamaciones');
});

test('desde el Monitor', async ({ page }) => {
  await goto(page, 'dashboard');
  await page.getByRole('tab').nth(1).click();
  const tarjeta = page.locator('sc-dashboard-widget-card').filter({ has: page.locator('sc-dashboard-group-panel') });
  const agentes = tarjeta.getByRole('button', { name: 'Asignar agentes', exact: true });
  await agentes.click();
  await page.getByRole('menu').getByRole('menuitem', { name: 'Exclusivo' }).click();
  await expect(panel(page)).toBeVisible();
  await comprobar(page, agentes, 'Exclusivo');
});
