import { expect, test } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * EL ESQUELETO DE CARGA DE LOS LISTADOS MIDE LO QUE SUS DATOS.
 *
 * El Supervisor no tiene servidor: la primera vez que se abre un listado, sus filas «tardan» 1,5 s y la tabla pinta su
 * esqueleto (`CargaSimuladaService`, regla 2 de «UX de pantalla»). Medido el 2026-10-13 con el ejemplo «DataTable» de
 * primeng.dev tal cual, una barra a todo el ancho por celda: las filas grises medían 33 y las de datos 44, 54 con foto y
 * 43 en Conversaciones, así que al llegar los datos cambiaba todo. Con la forma de cada columna (`ScColumnDef.skeleton`)
 * y sin el hueco de la línea base en las celdas reales, la fila mide lo mismo antes y después. Lo que fija:
 *   1. En un listado con foto, uno con el «⋮» y Conversaciones, la fila del esqueleto mide lo que la de datos y las
 *      columnas no cambian de ancho.
 *   2. Un navegador automático no espera si no lo pide `?latencia=1`: el resto de pruebas ve los datos al entrar.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await forceLightTheme(page);
  await disableAnimations(page);
});

const medir = (page: import('@playwright/test').Page) =>
  page.locator('sc-datatable').first().evaluate((tabla) => ({
    fila: tabla.querySelector('tbody tr')?.getBoundingClientRect().height ?? 0,
    columnas: [...tabla.querySelectorAll('thead th')].map((th) => Math.round(th.getBoundingClientRect().width)),
  }));

for (const ruta of ['admin/usuarios', 'admin/grupos', 'conversaciones']) {
  test(`${ruta}: la fila del esqueleto mide lo que la de datos`, async ({ page }) => {
    // Sin `goto`: espera además a que se pliegue la barra lateral, y eso se come parte de los 1,5 s que dura el
    // esqueleto; en un runner frío se los comió enteros (CI del 2026-10-15, admin/usuarios). Aquí no se clica nada.
    await page.goto(`/${ruta}?latencia=1`);
    const esqueletos = page.locator('sc-datatable p-skeleton');
    await expect(esqueletos.first()).toBeVisible();
    const cargando = await medir(page);
    await expect(esqueletos).toHaveCount(0, { timeout: 5_000 });
    const conDatos = await medir(page);
    // Medio píxel de margen: en Conversaciones la etiqueta centrada en su línea deja 0,25 de diferencia.
    expect(Math.abs(cargando.fila - conDatos.fila), `${cargando.fila} contra ${conDatos.fila}`).toBeLessThanOrEqual(0.5);
    expect(cargando.columnas).toEqual(conDatos.columnas);
  });
}

test('sin ?latencia=1, un navegador automático ve los datos al entrar', async ({ page }) => {
  await goto(page, 'admin/grupos');
  await expect(page.locator('sc-datatable tbody tr').first()).toBeVisible();
  await expect(page.locator('sc-datatable p-skeleton')).toHaveCount(0);
});
