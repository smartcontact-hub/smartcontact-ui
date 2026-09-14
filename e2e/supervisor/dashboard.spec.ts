import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * Red del Dashboard (adaptación del Monitor del Supervisor).
 *
 * Nació de dos defectos que llegaron a Rafa antes que a ninguna prueba (2026-09-14): el asistente de
 * widget cambiaba de tamaño hasta 76 px al tocar una categoría, y la rejilla no tenía comprobado
 * ningún ancho de tablet o móvil. Mide geometría, no aspecto: una captura no ve un salto que dura
 * lo que tarda en cargar la lista.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

/** Cajas del asistente que no deben moverse mientras se configura un widget. */
const geometria = (page: Page) =>
  page.evaluate(() =>
    Object.fromEntries(
      ['.p-dialog', '.assistant__stage', 'p-listbox', '.assistant__description', 'sc-select'].map((sel) => {
        const r = document.querySelector(sel)?.getBoundingClientRect();
        return [sel, r ? [r.x, r.y, r.width, r.height].map(Math.round).join(',') : null];
      }),
    ),
  );

test('el asistente de widget no cambia de tamaño al cambiar de categoría', async ({ page }) => {
  await goto(page, 'dashboard');
  await page.getByRole('button', { name: 'Añadir widget' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('p-listbox')).toBeVisible();

  const base = await geometria(page);
  expect(Object.values(base).every(Boolean), `falta alguna caja del asistente: ${JSON.stringify(base)}`).toBe(true);

  for (const categoria of ['Grupos', 'Agentes', 'Nodo IA', 'Tipificaciones', 'Campañas', 'Servicios']) {
    const radio = dialog.getByRole('radio', { name: categoria });
    await radio.click();
    await expect(radio).toHaveAttribute('aria-checked', 'true');
    expect(await geometria(page), `saltó al elegir «${categoria}»`).toEqual(base);
  }
});

test('pulsar otra pestaña cambia el monitor que se ve', async ({ page }) => {
  await goto(page, 'dashboard');
  const pestanas = page.getByRole('tab');
  await expect(pestanas).toHaveCount(2);
  const titulos = () => page.locator('sc-dashboard-widget-card h2').allTextContents();
  const antes = await titulos();

  await pestanas.nth(1).click();
  await expect(pestanas.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect.poll(titulos).not.toEqual(antes);
});

for (const ancho of [1440, 1024, 768, 390]) {
  test(`la rejilla cabe sin scroll lateral a ${ancho}px`, async ({ page }) => {
    await page.setViewportSize({ width: ancho, height: 900 });
    await goto(page, 'dashboard');
    await expect(page.locator('sc-dashboard-widget-card').first()).toBeVisible();

    /* El scroll de la app vive en `main`, no en el documento: medido con el desborde fabricado, el del
     * documento daba 0 igual. */
    const medida = await page.evaluate(() => ({
      scroll: Math.max(
        ...[document.documentElement, document.querySelector('main#main-content')].map((e) => (e ? e.scrollWidth - e.clientWidth : 0)),
      ),
      fuera: [...document.querySelectorAll('sc-dashboard-widget-card')]
        .map((c) => c.getBoundingClientRect())
        .filter((r) => r.right > window.innerWidth + 1 || r.left < -1).length,
    }));
    expect(medida).toEqual({ scroll: 0, fuera: 0 });
  });
}
