import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * LO QUE SE LEE AL PASAR EL RATÓN VA EN EL TOOLTIP DEL KIT (DD-212), el `pTooltip` de PrimeNG, y no en el `title` del
 * navegador, que lo enseña con su globo del sistema. Lo que fija:
 *   1. ninguna tabla de Grupos ni de Agentes lleva un `title` nativo;
 *   2. un icono con significado (el canal, la grabación, el tipo de extensión) enseña su nombre en el tooltip;
 *   3. un texto cortado lo enseña entero, y uno que cabe no lleva tooltip (`showOnEllipsis`);
 *   4. «Guardar» apagado dice por qué en el tooltip (sin cambios: desde DD-217 es el único porqué, lo que falta se dice al
 *      pulsar);
 *   5. en la ficha de grupo, la ayuda de Prioridad dice que solo cuenta en las conversaciones entrantes («Duplicar grupo»,
 *      que la compartía, ya no es un diálogo: DD-217);
 *   6. Monitor y Conversaciones, igual: sin `title` nativo, y sus iconos (la presencia, lo que hace una regla) dicen su
 *      nombre en el tooltip. Lo cortado de sus tablas lo miden `dashboard` y `conversations-table-scroll`.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const tooltip = (page: Page) => page.locator('.p-tooltip');
/** Al pie de la ventana, en medio: la esquina de arriba a la izquierda es el sidebar, que se abre al pasar y tapa Nombre. */
const salir = async (page: Page) => {
  const { width, height } = page.viewportSize()!;
  await page.mouse.move(width / 2, height - 4);
};

test('Grupos y Agentes: sin `title` nativo, y los iconos dicen su nombre en el tooltip del Kit', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await expect(page.locator('sc-datatable tbody tr').first()).toBeVisible();
  await expect(page.locator('main [title]')).toHaveCount(0);
  await page.locator('.sc-channel-row__item[data-channel="phone"]').first().hover();
  await expect(tooltip(page)).toHaveText('Teléfono');
  await salir(page);

  await goto(page, 'admin/agentes');
  await expect(page.locator('sc-datatable tbody tr').first()).toBeVisible();
  await expect(page.locator('main [title]')).toHaveCount(0);
  await page.locator('.recording').first().hover();
  await expect(tooltip(page)).toHaveText('Grabación habilitada');
  await salir(page);
  await expect(tooltip(page)).toHaveCount(0);
  await page.locator('.ext__kind').first().hover();
  await expect(tooltip(page)).toHaveCount(1);
});

test('un nombre que cabe no lleva tooltip; cortado, lo enseña entero', async ({ page }) => {
  await goto(page, 'admin/grupos');
  const nombre = page.locator('.table__td-name-text').first();
  await expect(nombre).toBeVisible();
  const entero = (await nombre.textContent())!.trim();
  await nombre.hover();
  // Sin «…» no hay nada que enseñar: el tooltip repetiría lo que ya se lee.
  await page.waitForTimeout(300);
  await expect(tooltip(page)).toHaveCount(0);
  await salir(page);

  // Se estrecha la celda hasta que el nombre se corta: `showOnEllipsis` mide al pasar el ratón.
  await nombre.evaluate((el) => {
    el.style.maxWidth = '3rem';
  });
  expect(await nombre.evaluate((el: HTMLElement) => el.scrollWidth > el.offsetWidth), 'el nombre sale cortado').toBe(true);
  await nombre.hover();
  await expect(tooltip(page)).toHaveText(entero);
});

test('«Guardar» apagado dice por qué en el tooltip', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/2');
  const guardar = page.getByRole('button', { name: 'Guardar', exact: true });
  await expect(guardar).toBeDisabled();
  await page.locator('sc-button', { has: guardar }).hover();
  await expect(tooltip(page)).toHaveText('No hay cambios que guardar');
});

test('ficha de grupo: la ayuda de Prioridad dice que solo cuenta en las conversaciones entrantes', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/12');
  await expect(page.locator('#group-section-general').getByRole('combobox', { name: 'Prioridad' })).toHaveAccessibleDescription(
    /Solo para las conversaciones entrantes\.$/,
  );
});

test('Monitor y Conversaciones: sin `title` nativo, y los iconos dicen su nombre en el tooltip del Kit', async ({ page }) => {
  await goto(page, 'dashboard');
  const punto = page.locator('sc-dashboard-agents-table tbody sc-badge').first();
  await expect(punto).toBeVisible();
  await expect(page.locator('main [title]')).toHaveCount(0);
  await punto.hover();
  await expect(tooltip(page)).toHaveText((await punto.getAttribute('aria-label'))!);
  await salir(page);

  await goto(page, 'conversaciones/reglas');
  const chip = page.locator('.rules-actions-chips sc-tag[role="img"]').first();
  await expect(chip).toBeVisible();
  await expect(page.locator('main [title]')).toHaveCount(0);
  await chip.hover();
  await expect(tooltip(page)).toHaveText((await chip.getAttribute('aria-label'))!);
  await salir(page);

  await goto(page, 'conversaciones');
  await expect(page.locator('[data-testid="conversations-table"] tbody tr').first()).toBeVisible();
  await expect(page.locator('main [title]')).toHaveCount(0);
});
