import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * TRES ALINEACIONES DE LAS FICHAS DE GRUPO Y AGENTE (barrido de consistencia del 2026-10-20, medido a 1440 en claro):
 *   1. El tooltip del nombre entero solo sale si el nombre se corta, no con uno que cabe. Desde DD-258 el nombre es
 *      texto también al editar (antes se pulsaba para escribirlo en su sitio, y el campo tenía sus propias medidas).
 *   2. Las cabeceras de las dos tablas de asignación miden lo mismo: el filtro de «Agente» estiraba la del grupo a 38,5
 *      contra los 32,7 de la del agente.
 *   3. «Ver detalle», bajo la tipificación: su texto, en la vertical del campo y de su etiqueta (antes, 8 a la derecha).
 */

test.use({ storageState: { cookies: [], origins: [] } });
test.use({ viewport: { width: 1440, height: 900 } });
test.beforeEach(async ({ page }) => {
  await forceLightTheme(page);
  await disableAnimations(page);
});

const tooltip = (page: Page) => page.locator('.p-tooltip');
const fuentes = (page: Page) => page.evaluate(() => document.fonts.ready.then(() => undefined));
/** Al pie de la ventana, en medio: la esquina de arriba a la izquierda es el sidebar. */
const salir = async (page: Page) => page.mouse.move(720, 896);

for (const ruta of ['admin/grupos/editar/11', 'admin/agentes/editar/1']) {
  test(`${ruta} · el nombre es texto, y si cabe no sale entero en un tooltip`, async ({ page }) => {
    await goto(page, ruta);
    await fuentes(page);
    const titulo = page.locator('main#main-content h1.headline__name');
    // DD-258: al editar, el nombre ya no se pulsa para escribirlo en su sitio (el Inplace era un `role="button"`).
    await expect(titulo.getByRole('button')).toHaveCount(0);
    await expect(titulo.getByRole('textbox')).toHaveCount(0);
    await titulo.hover();
    await page.waitForTimeout(300);
    await expect(tooltip(page)).toHaveCount(0);
  });
}

test('un nombre que no cabe en sus dos líneas enseña el entero en el tooltip', async ({ page }) => {
  // Lo contrario de lo de arriba, para que su «no sale» no lo dé un tooltip que no sale nunca.
  const enorme = 'Atención al cliente de la delegación de Madrid Norte y Castilla-La Mancha';
  await goto(page, 'admin/grupos/editar/11');
  await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(enorme);
  await salir(page);
  await page.locator('main#main-content h1.headline__name').hover();
  await expect(tooltip(page)).toHaveText(enorme);
});

test('las cabeceras de las dos tablas de asignación miden lo mismo, con la flecha de ordenar en la primera columna', async ({ page }) => {
  const alto = async (ruta: string) => {
    await goto(page, ruta);
    const fila = page.locator('.assign sc-datatable thead tr').first();
    await expect(fila).toBeVisible();
    await fuentes(page);
    return fila.evaluate((tr) => tr.getBoundingClientRect().height);
  };
  // Desde SISMAC-4058 (2026-10-20) «Agente» y «Grupo» ordenan por nombre, con la misma flecha: sin el filtro de estado.
  const grupo = await alto('admin/grupos/editar/11?seccion=agentes');
  await expect(page.locator('.assign thead th[data-field="agent"] p-sort-icon, .assign thead th[data-field="agent"] .p-sortable-column-icon').first()).toBeVisible();
  const agente = await alto('admin/agentes/editar/1?seccion=grupos');
  await expect(page.locator('.assign thead th[data-field="group"] p-sort-icon, .assign thead th[data-field="group"] .p-sortable-column-icon').first()).toBeVisible();
  expect(Math.abs(grupo - agente), `grupo ${grupo} frente a agente ${agente}`).toBeLessThan(0.5);

  // Ordenada, la cabecera tampoco crece.
  await goto(page, 'admin/grupos/editar/11?seccion=agentes');
  await page.locator('.assign thead th[data-field="agent"]').click();
  await expect(page.locator('.assign thead th[data-field="agent"]')).toHaveAttribute('aria-sort', 'ascending');
  const ordenada = await page.locator('.assign sc-datatable thead tr').first().evaluate((tr) => tr.getBoundingClientRect().height);
  expect(Math.abs(ordenada - agente), `ordenada ${ordenada} frente a agente ${agente}`).toBeLessThan(0.5);
});

test('«Ver detalle», bajo la tipificación: su texto empieza en la vertical del campo', async ({ page }) => {
  await goto(page, 'admin/grupos/editar/11?seccion=general');
  const boton = page.getByRole('button', { name: /^Ver detalle de/ });
  await boton.scrollIntoViewIfNeeded();
  await fuentes(page);
  const m = await boton.evaluate((btn) => {
    const campo = btn.closest('.field')!;
    const rango = document.createRange();
    rango.selectNodeContents(btn.querySelector('.p-button-label') ?? btn);
    return {
      texto: rango.getBoundingClientRect().x,
      campo: campo.querySelector('.p-select')!.getBoundingClientRect().x,
      etiqueta: campo.querySelector('label')!.getBoundingClientRect().x,
    };
  });
  expect(Math.abs(m.texto - m.campo), `texto en ${m.texto}, campo en ${m.campo}`).toBeLessThan(0.5);
  expect(Math.abs(m.texto - m.etiqueta), `texto en ${m.texto}, etiqueta en ${m.etiqueta}`).toBeLessThan(0.5);
});
