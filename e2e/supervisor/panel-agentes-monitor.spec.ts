import { expect, test, type Locator, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL PANEL RÁPIDO DE AGENTES, TAMBIÉN EN EL MONITOR (DD-168).
 *
 * Producto lo pidió el 2026-09-27 (apuntado en DD-121): asignar agentes es el 90 % del trabajo del supervisor, y el
 * panel solo se abría desde el listado de grupos. Aquí se abre desde el widget «Grupos» del Dashboard: con un grupo,
 * «Agentes» abre su panel; con varios, un menú elige cuál. Es el mismo `sc-group-agents-panel` del listado.
 *
 * Lo que se mide:
 * 1. Con varios grupos, el menú los lista y cada uno abre su panel sin salir del Dashboard.
 * 2. Con uno solo (el widget editado en el asistente, el camino de verdad), el botón abre el panel directamente.
 * 3. Guardar avisa como en el listado, cierra el panel y devuelve el foco a «Agentes»: ni `p-drawer` ni `sc-drawer`
 *    lo devuelven, y desde un menú el elemento que lo tenía ya no existe.
 * 4. No sale en modo pared ni en la vista previa del asistente: allí no hay paneles.
 * 5. El latido de 8 s rehace los widgets; ni el menú pierde su clic ni el panel lo que no se ha guardado.
 * 6. Los grupos se resuelven por id (como los agentes, DD-139): un grupo renombrado en Administración sale con su
 *    nombre nuevo.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** La tarjeta del widget «Grupos» del monitor activo. */
const tarjetaGrupos = (page: Page): Locator =>
  page.locator('sc-dashboard-widget-card').filter({ has: page.locator('sc-dashboard-group-panel') });

const panel = (page: Page) => page.locator('.agents-panel');
/** Un latido del Monitor (`LIVE_TICK_MS = 8000`, `dashboard-page.component.ts`) y medio segundo de margen. */
const LATIDO_Y_ALGO = 8_500;
/** El título va en la cabecera del cajón, fuera de `.agents-panel` (como lo lee `panel-agentes-grupo.spec.ts`). */
const tituloDelPanel = (page: Page, grupo: string) => page.getByText(`Agentes · ${grupo}`, { exact: true });

/** «Colas y agentes»: el segundo monitor de fábrica, con cuatro grupos en su widget «Grupos». */
const irAColasYAgentes = async (page: Page) => {
  await goto(page, 'dashboard');
  await page.getByRole('tab').nth(1).click();
  await expect(tarjetaGrupos(page)).toBeVisible();
};

test('con varios grupos, «Agentes» abre un menú con ellos, y cada uno abre su panel sin salir del Dashboard', async ({ page }) => {
  await irAColasYAgentes(page);
  const agentes = tarjetaGrupos(page).getByRole('button', { name: 'Asignar agentes', exact: true });
  await expect(agentes).toHaveText(/Agentes/);

  await agentes.click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem')).toHaveText(['ACD Demo C2CB', 'ACD outbound', 'Campaigns', 'Exclusivo']);

  await menu.getByRole('menuitem', { name: 'Exclusivo' }).click();
  await expect(tituloDelPanel(page, 'Exclusivo')).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('con un solo grupo, «Agentes» abre su panel directamente', async ({ page }) => {
  await irAColasYAgentes(page);
  // El camino de verdad: el widget se edita en el asistente y se deja vigilando un grupo.
  await tarjetaGrupos(page).getByRole('button', { name: 'Más acciones de Grupos' }).click();
  await page.getByRole('menuitem', { name: 'Editar' }).click();
  // Por clase y no por rol: el globo de avisos lleva `role="dialog"` en su host aunque esté cerrado.
  const asistente = page.locator('.p-dialog');
  for (const grupo of ['ACD Demo C2CB', 'ACD outbound', 'Campaigns']) {
    await asistente.getByRole('option', { name: grupo }).click();
  }
  await asistente.getByRole('button', { name: 'Guardar' }).click();
  await expect(asistente).toHaveCount(0);

  const agentes = tarjetaGrupos(page).getByRole('button', { name: 'Asignar agentes de Exclusivo' });
  await expect(agentes).toBeVisible();
  await agentes.click();
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(tituloDelPanel(page, 'Exclusivo')).toBeVisible();

  await panel(page).getByRole('button', { name: 'Cancelar' }).click();
  await expect(panel(page)).toHaveCount(0);
  await expect(agentes, 'al cerrar sin cambios, el foco vuelve al botón que lo abrió').toBeFocused();
});

test('guardar avisa como en el listado, cierra el panel y devuelve el foco a «Agentes»', async ({ page }) => {
  await irAColasYAgentes(page);
  const agentes = tarjetaGrupos(page).getByRole('button', { name: 'Asignar agentes', exact: true });
  await expect(agentes).toBeVisible();
  await agentes.click();
  await page.getByRole('menu').getByRole('menuitem', { name: 'Exclusivo' }).click();

  // El cambio, como en `panel-agentes-grupo.spec.ts`: la casilla «Asignado» de la primera fila.
  await panel(page).locator('tbody tr').first().getByRole('checkbox', { name: /^Asignado —/ }).click();
  await panel(page).getByRole('button', { name: 'Guardar (1)' }).click();

  await expect(page.getByText('Agentes de "Exclusivo" actualizados')).toBeVisible();
  await expect(panel(page)).toHaveCount(0);
  await expect(agentes).toBeFocused();
});

test('no sale en modo pared ni en la vista previa del asistente', async ({ page }) => {
  await goto(page, 'dashboard');
  const agentes = tarjetaGrupos(page).getByRole('button', { name: /^Asignar agentes/ });
  await expect(agentes, 'fuera del modo pared, el widget «Grupos» lo lleva').toHaveCount(1);

  // La vista previa del asistente es la misma tarjeta, sin menús ni paneles.
  await tarjetaGrupos(page).getByRole('button', { name: 'Más acciones de Grupos' }).click();
  await page.getByRole('menuitem', { name: 'Editar' }).click();
  const asistente = page.locator('.p-dialog');
  await expect(asistente.locator('sc-dashboard-widget-card')).toBeVisible();
  await expect(asistente.getByRole('button', { name: /^Asignar agentes/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(asistente).toHaveCount(0);

  await page.getByRole('button', { name: 'Modo pared' }).click();
  await expect(page.locator('.page--wall')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Asignar agentes/ })).toHaveCount(0);
});

test('el latido de 8 s no le quita nada al menú ni al panel', async ({ page }) => {
  /* El latido rehace cada widget del Monitor. Si el menú se rehiciera con él, perdería el primer clic (le pasaba al
   * menú de fila del listado, `list-page.component.ts`); si el panel recibiera otro objeto de grupo, recargaría y
   * perdería lo que no se ha guardado. Se espera un latido de verdad (`LIVE_TICK_MS`, 8 s), dos veces: con el reloj
   * falso de Playwright (`page.clock`), el menú emergente de PrimeNG no llegaba a abrirse (probado el 2026-10-05). */
  await irAColasYAgentes(page);
  const agentes = tarjetaGrupos(page).getByRole('button', { name: 'Asignar agentes', exact: true });
  await expect(agentes).toBeVisible();
  await agentes.click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem')).toHaveCount(4);

  await page.waitForTimeout(LATIDO_Y_ALGO);
  await menu.getByRole('menuitem', { name: 'Exclusivo' }).click();
  await expect(tituloDelPanel(page, 'Exclusivo')).toBeVisible();

  await panel(page).locator('tbody tr').first().getByRole('checkbox', { name: /^Asignado —/ }).click();
  await expect(panel(page).getByText('Sin guardar: 1')).toBeVisible();
  await page.waitForTimeout(LATIDO_Y_ALGO);
  await expect(panel(page).getByText('Sin guardar: 1')).toBeVisible();
  await expect(panel(page).getByRole('button', { name: 'Guardar (1)' })).toBeEnabled();
});

test('un grupo renombrado en Administración sale con su nombre nuevo', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/5');
  await page.locator('.headline__name .p-inplace-display').click();
  await page.locator('.name-inplace__input').fill('Exclusivo VIP');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Guardar' }).click();
  // El aviso sale cuando el almacén ya lo tiene: salir antes puede perder el nombre nuevo.
  await expect(page.getByText('Grupo "Exclusivo VIP" actualizado')).toBeVisible();

  await irAColasYAgentes(page);
  const agentes = tarjetaGrupos(page).getByRole('button', { name: 'Asignar agentes', exact: true });
  await expect(agentes).toBeVisible();
  await agentes.click();
  await expect(page.getByRole('menu').getByRole('menuitem', { name: 'Exclusivo VIP' })).toBeVisible();
});
