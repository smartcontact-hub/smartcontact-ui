import { expect, test } from '@playwright/test';

import { goto } from './helpers';

/**
 * CON «REDUCIR MOVIMIENTO», LOS LISTADOS PINTAN SUS FILAS.
 *
 * `sc-list-page` monta su tabla con `virtualScroll` (lista virtual de PrimeNG). Con la preferencia del sistema
 * `prefers-reduced-motion: reduce`, la lista de agentes podía salir con la cabecera y sin ninguna fila: los datos
 * estaban, pero la tabla no pintaba ninguna (medido en local sobre D3 y sobre F, 2026-10-02). Quien activa esa
 * preferencia por accesibilidad se quedaba sin listado. Lo que fija, en los tres listados de administración:
 *   1. con movimiento reducido, cada uno pinta sus filas, empezando por la primera de su semilla;
 *   2. y sin él, también (la guarda: el arreglo no rompe el caso de siempre).
 */

test.use({ storageState: { cookies: [], origins: [] } });

const LISTADOS = [
  { ruta: 'admin/agentes', primera: 'Tom Hanks' },
  { ruta: 'admin/grupos', primera: 'ACD Demo C2CB' },
  { ruta: 'admin/usuarios', primera: 'Mario Supervisor' },
];

for (const preferencia of ['reduce', 'no-preference'] as const) {
  test.describe(`con prefers-reduced-motion: ${preferencia}`, () => {
    test.use({ contextOptions: { reducedMotion: preferencia } });

    for (const { ruta, primera } of LISTADOS) {
      test(`${ruta} pinta sus filas`, async ({ page }) => {
        await goto(page, ruta);
        const filas = page.locator('main#main-content tbody tr');
        await expect(filas.filter({ hasText: primera }), `${ruta}: la fila de «${primera}»`).toHaveCount(1);
        expect(await filas.count(), `${ruta}: más de una fila a la vista`).toBeGreaterThan(5);
      });
    }
  });
}
