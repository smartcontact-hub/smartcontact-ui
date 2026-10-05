import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto, pickSelectOption } from './helpers';

/**
 * UNA TABLA DENTRO DE UNA SECCIÓN LLEGA AL PIE DE LA PANTALLA (DD-160).
 *
 * La revisión de producto del 2026-10-04, sobre la tabla de agentes de la ficha de grupo: hace scroll dentro, con la
 * cabecera fija (DD-95), pero su tope era el alto de la ventana menos 420 px fijos, sin saber dónde empieza. Medido el
 * 2026-10-04 a 1440×900: escondía 180 px de filas y dejaba 158 px vacíos bajo la tarjeta; a 1280×720, al revés, la
 * página entera desplazaba de 85 a 149 px. Como norma: si necesita más sitio, aprovecha el resto de la pantalla.
 *   1. la página no desplaza: lo que no cabe lo desplaza la tabla, por dentro;
 *   2. y a la tabla no le sobra sitio: con 2 px más, la página tendría que desplazarse. Con el tope fijo de antes
 *      sobraban 158, y esos 2 px no movían nada.
 * En pantallas bajas la tabla no baja de su suelo (`scale/18`) y entonces sí desplaza la página: no se prueba aquí.
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const desplaza = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector('main#main-content')!;
    return main.scrollHeight - main.clientHeight;
  });

for (const [ancho, alto] of [
  [1440, 900],
  [1512, 945],
] as const) {
  test(`a ${ancho}×${alto}, la tabla de agentes llega al pie: la página no desplaza y a la tabla no le sobra sitio`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: ancho, height: alto });
    await goto(page, 'admin/grupos/editar/11?seccion=agentes');
    const caja = page.locator('sc-agent-channel-table .table-card');
    await caja.locator('tbody tr').first().waitFor();
    // Todos: sin paginación (DD-171) y en la densidad compacta, los 13 del grupo ya caben; los de la lista entera, no.
    await page.locator('sc-agent-channel-table').getByRole('button', { name: 'Todos', exact: true }).click();
    await expect.poll(() => caja.locator('tbody tr').count()).toBeGreaterThan(13);
    await page.evaluate(() => document.fonts.ready);
    expect(await desplaza(page), 'lo que la página desplaza').toBeLessThanOrEqual(0);
    // La tabla tiene más filas de las que caben (desplaza por dentro): darle 2 px más tiene que empujar la página. Con
    // más de 100 filas desplaza su lista virtual (DD-95), no su contenedor.
    expect(
      await caja.evaluate((el) =>
        [...el.querySelectorAll('.p-datatable-table-container, .p-virtualscroller')].some((c) => c.scrollHeight > c.clientHeight),
      ),
    ).toBe(true);
    await caja.evaluate((el) => {
      const alto = `${el.getBoundingClientRect().height + 2}px`;
      el.style.maxBlockSize = alto;
      el.style.minBlockSize = alto;
    });
    expect(await desplaza(page), 'con 2 px más de tabla').toBeGreaterThanOrEqual(1);
  });
}

/* Los contactos de una agenda (DD-163) son la otra tabla dentro de una sección: la misma regla, sobre la agenda grande a
 * 50 filas por página, que no caben. */
for (const [ancho, alto] of [
  [1440, 900],
  [1512, 945],
] as const) {
  test(`a ${ancho}×${alto}, la tabla de contactos llega al pie: la página no desplaza y a la tabla no le sobra sitio`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: ancho, height: alto });
    await goto(page, 'admin/agendas/editar/9');
    const caja = page.locator('sc-agenda-contacts-table .table-card');
    await caja.locator('tbody tr').first().waitFor();
    await pickSelectOption(page, caja.locator('.p-paginator'), /^50$/);
    await expect(caja.locator('tbody tr')).toHaveCount(50);
    await page.evaluate(() => document.fonts.ready);
    expect(await desplaza(page), 'lo que la página desplaza').toBeLessThanOrEqual(0);
    expect(await caja.locator('.p-datatable-table-container').evaluate((c) => c.scrollHeight > c.clientHeight)).toBe(true);
    await caja.evaluate((el) => {
      const alto = `${el.getBoundingClientRect().height + 2}px`;
      el.style.maxBlockSize = alto;
      el.style.minBlockSize = alto;
    });
    expect(await desplaza(page), 'con 2 px más de tabla').toBeGreaterThanOrEqual(1);
  });
}
