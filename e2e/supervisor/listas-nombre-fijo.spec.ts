import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EN UNA LISTA ESTRECHA, EL NOMBRE NO SE VA (DD-193).
 *
 * Medido el 2026-10-11 en Agentes, en un navegador limpio: Nombre medía 32 px a 900 y a 1024, y 100 a 1280. Era la única
 * columna sin ancho y se quedaba con lo que sobrara del mínimo de la tabla, escrito a mano (100,375rem); al llegar
 * Equipos (11rem) nadie lo subió. Primer resuelve la tabla estrecha desplazando de lado con la celda que nombra la fila
 * a la vista; aquí, con lo nativo de PrimeNG (`pFrozenColumn`):
 *   1. el mínimo de la tabla sale de sus columnas, y la que crece no baja de 15rem (240 px);
 *   2. la casilla y el nombre se quedan fijos al desplazar la tabla de lado hasta el final;
 *   3. a 1440 no hay nada que desplazar.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const LISTAS = ['admin/agentes', 'admin/grupos', 'admin/usuarios'] as const;

for (const ancho of [900, 1024]) {
  for (const ruta of LISTAS) {
    test(`${ruta} a ${ancho}: el nombre mide al menos 240 y se queda al desplazar la tabla de lado`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 900 });
      await goto(page, ruta);
      await page.locator('.table-card tbody tr').first().waitFor();
      const m = await page.evaluate(async () => {
        // Con lista virtual desplaza `.p-virtualscroller`; sin ella, el contenedor de la tabla.
        const candidatas = [
          ...document.querySelectorAll<HTMLElement>('.table-card .p-virtualscroller, .table-card .p-datatable-table-container'),
        ];
        const caja = candidatas.find((c) => c.scrollWidth - c.clientWidth > 1) ?? candidatas[0]!;
        const ths = [...caja.querySelectorAll('thead th')];
        const nombre = ths.find((th) => !th.classList.contains('sc-datatable__check') && th.textContent?.trim())!;
        const check = caja.querySelector('thead th.sc-datatable__check')!;
        const ancho = nombre.getBoundingClientRect().width;
        const oculto = caja.scrollWidth - caja.clientWidth;
        caja.scrollLeft = caja.scrollWidth;
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const borde = caja.getBoundingClientRect().left;
        return {
          ancho,
          oculto,
          desplazado: caja.scrollLeft,
          checkX: Math.round(check.getBoundingClientRect().left - borde),
          nombreX: Math.round(nombre.getBoundingClientRect().left - borde),
        };
      });
      expect(m.ancho, 'el ancho de Nombre').toBeGreaterThanOrEqual(240);
      expect(m.oculto, 'a este ancho la tabla desplaza de lado').toBeGreaterThan(0);
      expect(m.desplazado, 'y se ha desplazado').toBeGreaterThan(0);
      expect([m.checkX, m.nombreX], 'casilla y nombre, en su sitio tras desplazar').toEqual([0, 40]);
    });
  }
}

test('a 1440, ninguna de las tres desplaza de lado', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const ruta of LISTAS) {
    await goto(page, ruta);
    await page.locator('.table-card tbody tr').first().waitFor();
    const oculto = await page.evaluate(() =>
      Math.max(
        ...[...document.querySelectorAll<HTMLElement>('.table-card .p-virtualscroller, .table-card .p-datatable-table-container')].map(
          (c) => c.scrollWidth - c.clientWidth,
        ),
      ),
    );
    expect(oculto, ruta).toBeLessThanOrEqual(1);
  }
});
