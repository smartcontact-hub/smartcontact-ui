import { expect, test, type Page } from '@playwright/test';

import { disableAnimations, forceLightTheme, goto } from './helpers';

/**
 * TRES ALINEACIONES DE LAS FICHAS DE GRUPO Y AGENTE (barrido de consistencia del 2026-10-20, medido a 1440 en claro):
 *   1. El nombre editable: el campo empieza en la vertical del título (antes sobresalía 9,75 por la izquierda), mide lo
 *      que pide el nombre con un mínimo (antes, 167 siempre), y el tooltip del nombre entero solo sale si el nombre se
 *      corta: ni con uno que cabe ni encima del campo al editar (antes, en los dos).
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

/** El campo del nombre: dónde empieza, cuánto mide, y lo que ocupa su texto frente al hueco que le deja su relleno. */
const medirCampo = (page: Page) =>
  page.evaluate(() => {
    const campo = document.querySelector<HTMLInputElement>('.name-inplace__input')!;
    const caja = campo.getBoundingClientRect();
    const cs = getComputedStyle(campo);
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = cs.font;
    return {
      x: caja.x,
      ancho: caja.width,
      minimo: parseFloat(cs.minInlineSize),
      titulo: document.querySelector('.headline__name')!.getBoundingClientRect().x,
      texto: ctx.measureText(campo.value).width,
      desborda: campo.scrollWidth > campo.clientWidth,
      hueco:
        caja.width -
        parseFloat(cs.borderLeftWidth) -
        parseFloat(cs.borderRightWidth) -
        parseFloat(cs.paddingLeft) -
        parseFloat(cs.paddingRight),
    };
  });

for (const ruta of ['admin/grupos/editar/11', 'admin/agentes/editar/1']) {
  test(`${ruta} · el campo del nombre empieza en la vertical del título y mide lo que pide el nombre`, async ({ page }) => {
    await goto(page, ruta);
    await fuentes(page);
    await page.locator('.headline__name .p-inplace-display').click();
    const campo = page.locator('.name-inplace__input');
    await expect(campo).toBeFocused();
    const m = await medirCampo(page);
    expect(Math.abs(m.x - m.titulo), `${ruta}: el campo empieza donde el título (${m.x} frente a ${m.titulo})`).toBeLessThan(0.5);
    // Ni desborda ni sobra: el texto llena el hueco del campo (antes, 147,75 de hueco para cualquier nombre, y «Online
    // Support» desbordaba: scrollWidth 166 contra clientWidth 165).
    expect(m.desborda, `${ruta}: el campo desplaza su texto`).toBe(false);
    expect(m.texto, `${ruta}: el nombre cabe en el campo`).toBeLessThanOrEqual(m.hueco + 0.01);
    expect(m.hueco - m.texto, `${ruta}: el campo mide lo que pide el nombre`).toBeLessThan(1);

    // Un nombre de una letra se queda en el mínimo del campo, no en nada.
    await campo.fill('A');
    const corto = await medirCampo(page);
    expect(corto.minimo, `${ruta}: el campo tiene un mínimo`).toBeGreaterThan(0);
    expect(corto.ancho, `${ruta}: con una letra, el campo mide su mínimo`).toBeCloseTo(corto.minimo, 1);
    await page.keyboard.press('Escape');
  });

  test(`${ruta} · el nombre entero no sale en el tooltip, ni en reposo si cabe ni encima del campo al editar`, async ({ page }) => {
    await goto(page, ruta);
    await fuentes(page);
    // En reposo, un nombre que cabe no lleva tooltip: antes lo sacaba el `h1`, que desborda por el relleno del display.
    await page.locator('.name-inplace__text').hover();
    await page.waitForTimeout(300);
    await expect(tooltip(page)).toHaveCount(0);

    await page.locator('.headline__name .p-inplace-display').click();
    const campo = page.locator('.name-inplace__input');
    await expect(campo).toBeFocused();
    await campo.hover();
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
  await page.locator('.name-inplace__text').hover();
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
